import React, {
  useCallback,
  useRef,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Disclaimer from "../disclaimer/Disclaimer";
import Header from "../navigation/Header";
import Log from "../log/Log";
import Webusb from "../disclaimer/Webusb";

import { PortLost } from "../../utils/obfuscated-exploit/Errors";
import Exploit from "../../utils/obfuscated-exploit/Exploit";

/*
import { PortLost } from "../../utils/exploit/Errors";
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
  const dispatch = useDispatch();

  const unlockStep = useRef(1);
  const disconnected = useRef(false);
  const rebooting = useRef(false);
  const running = useRef(false);

  const attempted = useSelector(selectAttempted);
  const hasAdb = useSelector(selectHasAdb);
  const rooting = useSelector(selectRooting);

  const handleClick = useCallback(async() => {
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

        while(currentTry < maxTry && !done) {
          try {
            switch (unlockStep.current) {
              case 1: {
                if (currentTry === 0) {
                  log("Attempting Step 1...");
                }

                const device = await exploit.unlockStep1();

                log(` - Found Device: ${device}`);
                log("Step 1 - Success! Rebooting...");

                rebooting.current = true;
                unlockStep.current = 2;
                done = true;

                await exploit.restart();
              } break;

              case 2: {
                if (currentTry === 0) {
                  log("Attempting Step 2...");
                }
                const restart = await exploit.unlockStep2();

                unlockStep.current = 3;
                done = true;

                if(!restart) {
                  log("Step 2 - Success!");
                  await exploit.sleep(3000);

                  shouldRunUnlock = true;
                } else {
                  log("Step 2 - Success! Rebooting...");
                  rebooting.current = true;
                  await exploit.restart();
                }
              } break;

              case 3: {
                if (currentTry === 0) {
                  log("Attempting Step 3...");
                }
                await exploit.unlockStep3();
                log("Step 3 - Success!");

                unlockStep.current = 4;
                done = true;

                shouldRunUnlock = true;
              } break;

              case 4: {
                if (currentTry === 0) {
                  log("Attempting Step 4...");
                }
                await exploit.unlockStep4();
                log("Step 4 - Success! Rebooting...");

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
                  log("Attempting Step 5...");
                }
                const isRebooting = await exploit.unlockStep5();

                unlockStep.current = 6;
                done = true;

                if(isRebooting) {
                  rebooting.current = true;
                  log("Step 5 - Success! Rebooting...");
                } else {
                  log("Step 5 - Success!");
                  shouldRunUnlock = true;
                }
              } break;

              case 6: {
                log("All done - your device has been successfully rooted!");
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
            } else {
              console.log(e);
              currentTry += 1;

              await exploit.sleep(1000);
            }
          }
        }

        if(!done && !disconnected.current) {
          log(`Failed after ${maxTry} retries.`);
          try {
            exploit.closePort();
          } catch (e) {
            console.log(e);
          }
        }

        if(!done && disconnected.current) {
          log("Device went away...");
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
        log("Device came back...");
      }
      rebooting.current = false;

      const ports = await navigator.serial.getPorts();
      if(ports.length > 0 ) {
        // Assume that the first available port is the device we are looking for.
        const port = ports[0];
        await exploit.openPort(port);

        // Wait a bit after reconnection to make sure the device does not go
        // away again.
        await exploit.sleep(3000);

        // Run the next unlock step (or the failed one if device went away)
        runUnlock();
      }
    };

    navigator.serial.addEventListener("connect", reConnect);
    navigator.serial.addEventListener("disconnect", () => {
      disconnected.current = true;

      if(!rooting && attempted) {
        dispatch(reset);
      }
    });

    const triggerUnlock = async() => {
      const filters = [{ usbVendorId: 0x2ca3 }];
      const port = await navigator.serial.requestPort({ filters });
      await exploit.openPort(port);

      runUnlock();
    };
    triggerUnlock();
  }, [attempted, dispatch, rooting]);

  return(
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header />

      <Stack spacing={2}>
        <>
          {!window.navigator.usb &&
            <Webusb />}

          <Disclaimer
            lines={[
              "Make sure that the device to be rooted is powered from a reliable power source",
              "Make sure that the device is properly cooled if necessary",
              "Only have one device connected/paired",
              "Do not power off during rooting",
              "Proceed at your own risk",
            ]}
            title="Disclaimer:"
          />

          <Button
            disabled={rooting || !window.navigator.usb}
            onClick={handleClick}
            variant="contained"
          >
            Root Device
          </Button>

          {hasAdb &&
            <Alert severity="success">
              <Typography>
                Device already rooted
              </Typography>
            </Alert>}

          <Log />
        </>
      </Stack>
    </Container>
  );
}
