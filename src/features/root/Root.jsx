import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import * as Sentry from "@sentry/react";
import ReactGA from "react-ga4";

import Claimed from "../overlays/Claimed";
import Disclaimer from "../disclaimer/Disclaimer";
import Donate from "../donate/Donate";
import Header from "../navigation/Header";
import Log from "../log/Log";
import Webusb from "../disclaimer/Webusb";

import { selectCanClaim } from "../tabGovernor/tabGovernorSlice";

import {
  PatchFailed,
  PortLost,
  UnlockFailed,
  UnsupportedFirmwareVersion,
  SigningServerUnreachable,
} from "../../utils/obfuscated-exploit/Errors";
import Exploit from "../../utils/obfuscated-exploit/Exploit";

/*
import {
  PatchFailed,
  PortLost,
  UnlockFailed,
  UnsupportedFirmwareVersion,
  SigningServerUnreachable,
} from "../../utils/exploit/Errors";
import Exploit from "../../utils/exploit/Exploit.js";
*/

import {
  fail,
  reset,
  root,
  success,
  selectAttempted,
  selectRooting,
} from "./rootSlice";

import {
  appendToLog,
  clearLog,
  selectClaimed,
  selectHasAdb,
  setClaimed,
} from "../device/deviceSlice";

import { selectDisclaimersStatus } from "../settings/settingsSlice";

import { selectDonationState } from "../donate/donateSlice";

const corsProxy = process.env.REACT_APP_EXPLOIT_CORS_PROXY || "";
const exploit = new Exploit(corsProxy);
const rebootTimeMinSeconds = 7;
const rebootTimeMaxSeconds = 60;

export default function Root() {
  const { t } = useTranslation("root");
  const dispatch = useDispatch();

  const [autoConnect, setAutoConnect] = useState(false);

  const unlockStep = useRef(1);
  const unlockStepLast = useRef(1);
  const disconnected = useRef(false);
  const rebooting = useRef(false);
  const running = useRef(false);

  const disconnectListenerRef = useRef();
  const reConnectListenerRef = useRef();
  const rebootTimeoutRef = useRef();

  const timeStarted = useRef(new Date());
  const timeRebootInitiated = useRef();
  const rebootRetried = useRef(false);

  const attempted = useSelector(selectAttempted);
  const hasAdb = useSelector(selectHasAdb);
  const rooting = useSelector(selectRooting);

  const donationState = useSelector(selectDonationState);

  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  const isClaimed = useSelector(selectClaimed);
  const canClaim = useSelector(selectCanClaim);

  let runUnlock;

  const log = useCallback((message) => {
    const now = new Date();
    const difference = new Date(now - timeStarted.current);
    let minutes = difference.getMinutes();
    let seconds = difference.getSeconds();

    minutes = minutes < 10 ? `0${minutes}` : minutes;
    seconds = seconds < 10 ? `0${seconds}` : seconds;

    const formatted = `${minutes}:${seconds} ${message}`;

    console.log(formatted);
    dispatch(appendToLog(formatted));
  }, [dispatch]);

  const waitForReboot = useCallback(() => {
    return setTimeout(() => {
      unlockStep.current = 7;
      runUnlock();
    }, rebootTimeMaxSeconds * 1000);
  }, [runUnlock]);

  const initiateReboot = useCallback(async() => {
    try {
      await exploit.restart();

      rebooting.current = true;
      timeRebootInitiated.current = new Date();
      clearTimeout(rebootTimeoutRef.current);
      rebootTimeoutRef.current = waitForReboot();
    } catch(e) {
      console.log("Rebooting failed...");
    }
  }, [waitForReboot]);

  runUnlock = useCallback(async () => {
    if(unlockStep.current > 0 && !running.current) {
      running.current = true;

      let maxTry = 10;
      let currentTry = 0;
      let done = false;
      let shouldRunUnlock = false;
      let device = "Unknown";
      let version = "Unknown";

      while(currentTry < maxTry && !done) {
        try {
          switch (unlockStep.current) {
            case 1: {
              if (currentTry === 0) {
                log(t("step1"));
              }

              device = await exploit.unlockStep1();
              version = await exploit.getVersion();

              ReactGA.gtag("event", "rootDevice", {
                device,
                version,
              });

              log(t("foundDevice", {
                device,
                version,
              }));
              log(t("step1Success"));

              done = true;
              unlockStep.current = 2;
              unlockStepLast.current = 1;
              rebooting.current = true;

              await initiateReboot();
            } break;

            case 2: {
              if (currentTry === 0) {
                log(t("step2"));
              }
              const restart = await exploit.unlockStep2();

              done = true;
              unlockStep.current = 3;
              unlockStepLast.current = 2;

              if(!restart) {
                log(t("step2Success"));
                await exploit.sleep(3000);

                shouldRunUnlock = true;
              } else {
                log(t("step2Reboot"));
                await initiateReboot();
              }
            } break;

            case 3: {
              if (currentTry === 0) {
                log(t("step3"));
              }
              await exploit.unlockStep3();
              log(t("step3Success"));

              unlockStep.current = 4;
              done = true;

              shouldRunUnlock = true;
            } break;

            case 4: {
              if (currentTry === 0) {
                log(t("step4"));
              }

              await exploit.unlockStep4();
              log(t("step4Success"));

              done = true;
              unlockStep.current = 5;
              unlockStepLast.current = 4;

              /**
               * Step 4 waits for response, the following outcomes are possible:
               * 1. No response: Device might already be rebooting
               * 2. Response with return code 0x00 - everything went well
               * 3. Non 0x00 response code - there was some error
               *
               * Cases 1 and 2 are fine and expected, case 3 will thorw an error,
               * rooting has to be restarted after a power cycle
               */

              await exploit.sleep(3000);
              await initiateReboot();
            } break;

            case 5: {
              if (currentTry === 0) {
                log(t("step5"));
              }
              const isRebooting = await exploit.unlockStep5();

              done = true;
              unlockStep.current = 6;
              unlockStepLast.current = 5;

              if(isRebooting) {
                log(t("step5Reboot"));

                rebooting.current = true;
                timeRebootInitiated.current = new Date();
                clearTimeout(rebootTimeoutRef.current);
                rebootTimeoutRef.current = waitForReboot();
              } else {
                shouldRunUnlock = true;
              }
            } break;

            case 6: {
              if(!rebootTimeoutRef.current) {
                log(t("done"));

                ReactGA.gtag("event", "rootDone", {
                  device,
                  step: unlockStep.current,
                  retry: currentTry,
                });

                unlockStep.current = 0;

                try {
                  exploit.closePort();
                  dispatch(setClaimed(false));
                } catch(e) {
                  console.log("Failed closing port:", e);
                }

                dispatch(success());
              }

              done = true;
            } break;

            case 7: {
              log(t("rebootTimeout"));

              unlockStep.current = 0;
              done = true;

              ReactGA.gtag("event", "rebootTimeout", {
                device,
                step: unlockStepLast.current,
                retry: currentTry,
              });

              Sentry.captureMessage("Reebot timout reached.", { extra: { step: unlockStepLast.current } });

              dispatch(fail());
            } break;

            default: {
              console.log("Unknown Unlock Step", unlockStep);
              done = true;
            }
          }
        } catch(e) {
          if(e instanceof SigningServerUnreachable) {
            log(t("signingServerUnreachable"));

            shouldRunUnlock = false;
            done = true;
          } else if(e instanceof UnsupportedFirmwareVersion) {
            log(t("unsupportedFirmware"));

            shouldRunUnlock = false;
            done = true;
          } else if(e instanceof UnlockFailed) {
            log(t("unlockFailed"));

            shouldRunUnlock = false;
            done = true;
          } else if(e instanceof PortLost) {
            disconnected.current = true;
            break;
          } else if(e instanceof PatchFailed) {
            log(t("manualReboot"));

            ReactGA.gtag("event", "patchFailed", {
              device,
              step: unlockStep.current,
              retry: currentTry,
            });

            Sentry.captureException(e, {
              extra: {
                device,
                step: unlockStep.current,
                retry: currentTry,
              },
            });

            rebooting.current = true;
            unlockStep.current = 2;
            done = true;
          } else {
            console.log("Unlock step failed:", e);

            Sentry.captureException(e, {
              extra: {
                device,
                step: unlockStep.current,
                retry: currentTry,
              },
            });

            currentTry += 1;
            await exploit.sleep(1000);
          }
        }
      }

      if(!done && !disconnected.current) {
        log(`Failed after ${maxTry} retries.`);

        ReactGA.gtag("event", "rootFailed", {
          device,
          step: unlockStep.current,
          retries: maxTry,
        });

        Sentry.captureMessage(`Failed after ${maxTry} retries.`, { extra: { step: unlockStep.current } });

        try {
          exploit.closePort();
        } catch (e) {
          console.log("Failed closing port:", e);
        }
      }

      running.current = false;
      if(shouldRunUnlock) {
        runUnlock();
      }
    }
  }, [dispatch, initiateReboot, log, runUnlock, t, waitForReboot]);

  const reConnectListener = useCallback(async () => {
    if(autoConnect) {
      clearTimeout(rebootTimeoutRef.current);
      rebootTimeoutRef.current = null;

      if(rebooting.current) {
        const now = new Date();
        const diff = new Date(now - timeRebootInitiated.current);
        const seconds = diff.getSeconds();

        if(seconds < rebootTimeMinSeconds && !rebootRetried.current) {
          rebootRetried.current = true;
          log(t("rebootTimeShort"));

          await initiateReboot();
          return;
        }
      }
      rebootRetried.current = false;

      disconnected.current = false;
      if(!rebooting.current && unlockStep.current > 0) {
        log(t("deviceBack"));
      }
      rebooting.current = false;

      // Make sure at least one port is available and run unlock
      await exploit.sleep(3000);
      const ports = await navigator.serial.getPorts();
      if(ports.length > 0 ) {
        runUnlock();
      } else {
        console.log("No serial ports found");
      }
    }
  }, [autoConnect, initiateReboot, log, runUnlock, t]);

  const disconnectListener = useCallback(() => {
    if(autoConnect) {
      disconnected.current = true;

      if(!rebooting.current && unlockStep.current > 0) {
        log(t("deviceLost"));
      }

      if(!rooting && attempted) {
        dispatch(reset());
      }
    }
  }, [attempted, autoConnect, dispatch, log, rooting, t]);

  const triggerUnlock = useCallback(async() => {
    const filters = [{ usbVendorId: 0x2ca3 }];
    try {
      const port = await navigator.serial.requestPort({ filters });
      dispatch(setClaimed(true));
      await exploit.openPort(port);

      runUnlock();
    } catch(e) {
      dispatch(reset());
    }
  }, [dispatch, runUnlock]);

  const handleClick = useCallback(async() => {
    ReactGA.gtag("event", "rootClicked");
    timeStarted.current = new Date();

    dispatch(root());
    triggerUnlock();
  }, [dispatch, triggerUnlock]);

  useEffect(() => {
    if(navigator.serial) {
      navigator.serial.removeEventListener("connect", reConnectListenerRef.current);
      reConnectListenerRef.current = reConnectListener;
      navigator.serial.addEventListener("connect", reConnectListenerRef.current);
    }
  }, [reConnectListener]);

  useEffect(() => {
    if(navigator.serial) {
      navigator.serial.removeEventListener("disconnect", disconnectListenerRef.current);
      disconnectListenerRef.current = disconnectListener;
      navigator.serial.addEventListener("disconnect", disconnectListenerRef.current);
    }
  }, [disconnectListener]);

  // Check if we should autoconnect to the device
  useEffect(() => {
    setAutoConnect(isClaimed && rooting);
  }, [isClaimed, rooting, setAutoConnect]);

  // Clean up when switching context (onUnmount)
  useEffect(() => {
    return async() => {
      dispatch(clearLog());
    };
  }, [dispatch]);

  return(
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header />

      <Stack spacing={2}>
        <>
          {!window.navigator.serial &&
            <Webusb />}

          {!disclaimersStatus &&
            <>
              <Alert severity="error">
                <Typography sx={{ fontWeight: "bold" }}>
                  {t("cooling")}
                </Typography>
              </Alert>

              <Disclaimer
                lines={[
                  t("disclaimerLine1"),
                  t("disclaimerLine2"),
                  t("disclaimerLine3"),
                  t("disclaimerLine4"),
                ]}
                title={t("disclaimerTitle")}
              />
            </>}

          {!donationState &&
            <Donate />}

          {hasAdb &&
            <Alert severity="success">
              <Typography>
                {t("rooted")}
              </Typography>
            </Alert>}

          <Button
            disabled={rooting || !window.navigator.serial || !donationState}
            onClick={handleClick}
            variant="contained"
          >
            {t("root")}
          </Button>

          <Log />
        </>
      </Stack>

      {!canClaim &&
        <Claimed />}
    </Container>
  );
}
