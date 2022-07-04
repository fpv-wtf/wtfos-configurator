import React, {
  useCallback,
  useRef,
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

import Disclaimer from "../disclaimer/Disclaimer";
import Header from "../navigation/Header";
import Log from "../log/Log";
import Webusb from "../disclaimer/Webusb";

import {
  PatchFailed,
  PortLost,
} from "../../utils/obfuscated-exploit/Errors";
import Exploit from "../../utils/obfuscated-exploit/Exploit";

/*
import {
  PatchFailed,
  PortLost,
} from "../../utils/exploit/Errors";
import Exploit from "../../utils/exploit/Exploit";
*/

import {
  reset,
  root,
  success,
  selectAttempted,
  selectRooting,
} from "./rootSlice";

import {
  appendToLog,
  selectHasAdb,
} from "../device/deviceSlice";

const exploit = new Exploit("https://cors.bubblesort.me/?");

export default function Root() {
  const { t } = useTranslation("root");
  const dispatch = useDispatch();

  const unlockStep = useRef(1);
  const disconnected = useRef(false);
  const rebooting = useRef(false);
  const running = useRef(false);

  const attempted = useSelector(selectAttempted);
  const hasAdb = useSelector(selectHasAdb);
  const rooting = useSelector(selectRooting);

  const handleClick = useCallback(async() => {
    ReactGA.gtag("event", "rootClicked");

    dispatch(root());

    const log = (message) => {
      console.log(message);
      dispatch(appendToLog(message));
    };

    const runUnlock = async () => {
      if(unlockStep.current > 0 && !running.current) {
        running.current = true;

        let maxTry = 10;
        let currentTry = 0;
        let done = false;
        let shouldRunUnlock = false;
        let device = "Unknown";

        while(currentTry < maxTry && !done) {
          try {
            switch (unlockStep.current) {
              case 1: {
                if (currentTry === 0) {
                  log(t("step1"));
                }

                device = await exploit.unlockStep1();

                ReactGA.gtag("event", "rootDevice", { device });

                log(t("foundDevice", { device } ));
                log(t("step1Success"));

                rebooting.current = true;
                unlockStep.current = 2;
                done = true;

                await exploit.restart();
              } break;

              case 2: {
                if (currentTry === 0) {
                  log(t("step2"));
                }
                const restart = await exploit.unlockStep2();

                unlockStep.current = 3;
                done = true;

                if(!restart) {
                  log(t("step2Success"));
                  await exploit.sleep(3000);

                  shouldRunUnlock = true;
                } else {
                  log(t("step2SuccessReboot"));
                  rebooting.current = true;
                  await exploit.restart();
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

                rebooting.current = true;
                unlockStep.current = 5;
                done = true;

                try {
                  await exploit.restart();
                } catch (e) {
                  console.log("Device might already be restarting", e);
                }
              } break;

              case 5: {
                if (currentTry === 0) {
                  log(t("step5"));
                }
                const isRebooting = await exploit.unlockStep5();

                unlockStep.current = 6;
                done = true;

                if(isRebooting) {
                  rebooting.current = true;
                  log(t("step5Reboot"));
                } else {
                  log(t("step5Success"));
                  shouldRunUnlock = true;
                }
              } break;

              case 6: {
                log(t("done"));

                ReactGA.gtag("event", "rootDone", {
                  device,
                  step: unlockStep.current,
                  retry: currentTry,
                });

                unlockStep.current = 0;
                done = true;

                try {
                  exploit.closePort();
                } catch(e) {
                  console.log(e);
                }

                dispatch(success());
              } break;

              default: {
                console.log("Unknown Unlock Step", unlockStep);
                done = true;
              }
            }
          } catch(e) {
            if(e instanceof PortLost) {
              disconnected.current = true;
              break;
            } else if(e instanceof PatchFailed) {
              log(t("rewind2"));

              ReactGA.gtag("event", "rootRewind", {
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

              unlockStep.current = 2;

              currentTry += 1;
              await exploit.sleep(1000);
            } else {
              console.log(e);

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

        if(!done && disconnected.current) {
          log(t("deviceLost"));
        }

        running.current = false;
        if(shouldRunUnlock) {
          runUnlock();
        }
      }
    };

    const reConnect = async () => {
      disconnected.current = false;
      if(!rebooting.current && unlockStep.current > 0) {
        log(t("deviceBack"));
      }
      rebooting.current = false;

      const ports = await navigator.serial.getPorts();
      if(ports.length > 0 ) {
        // Assume that the first available port is the device we are looking for.
        const port = ports[0];
        await exploit.openPort(port);

        // Wait a bit after reconnection to make sure the device does not go
        // away again and services had time to restart.
        await exploit.sleep(3000);

        // Run the next unlock step (or the failed one if device went away)
        runUnlock();
      }
    };

    navigator.serial.addEventListener("connect", reConnect);
    navigator.serial.addEventListener("disconnect", () => {
      disconnected.current = true;

      if(!rooting && attempted) {
        dispatch(reset());
      }
    });

    const triggerUnlock = async() => {
      const filters = [{ usbVendorId: 0x2ca3 }];
      try {
        const port = await navigator.serial.requestPort({ filters });
        await exploit.openPort(port);

        runUnlock();
      } catch(e) {
        dispatch(reset());
      }
    };
    triggerUnlock();
  }, [attempted, dispatch, rooting, t]);

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

          {hasAdb &&
            <Alert severity="success">
              <Typography>
                {t("rooted")}
              </Typography>
            </Alert>}

          <Button
            disabled={rooting || !window.navigator.serial}
            onClick={handleClick}
            variant="contained"
          >
            {t("root")}
          </Button>

          <Log />
        </>
      </Stack>
    </Container>
  );
}
