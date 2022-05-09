import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import AdbWebUsbBackend, { AdbWebUsbBackendWatcher } from "@yume-chan/adb-backend-webusb";
import { Adb } from "@yume-chan/adb";
import {
  Routes,
  Route,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import "./App.css";

import AdbWrapper from "./utils/AdbWrapper";

import Device from "./features/device/Device";
import Header from "./features/header/Header";

import Cli from "./features/cli/Cli";
import Home from "./features/home/Main";
import Packages from "./features/packages/Packages";
import Startup from "./features/startup/Startup";

import Setup from "./features/setup/Setup";
import Install from "./features/setup/Install";
import Remove from "./features/setup/Remove";
import Update from "./features/setup/Update";

import {
  checkBinaries,
  connected,
  connecting,
  connectionFailed,
  disconnected,
  selectConnected,
  selectError,
} from "./features/device/deviceSlice";

function App() {
  const dispatch = useDispatch();

  const isConnected = useSelector(selectConnected);
  const error = useSelector(selectError);

  const [adb, setAdb] = useState(null);

  const connectToDevice = useCallback(async (device) => {
    try {
      const credentialStore = new AdbWebCredentialStore();
      const streams = await device.connect();
      const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
      const adbWrapper = new AdbWrapper(adbLocal);

      await adbWrapper.establishReverseSocket(1);

      setAdb(adbWrapper);
      dispatch(connected());
      dispatch(checkBinaries(adbWrapper));
    } catch(e) {
      console.log(e);
      dispatch(connectionFailed());
    }
  }, [dispatch]);

  useEffect(() => {
    const getDevices = async () => {
      if(!isConnected) {
        const autoConnect = async() => {
          const devices = await AdbWebUsbBackend.getDevices();
          if(devices.length > 0) {
            dispatch(connecting());
            await connectToDevice(devices[0]);
          }
        };
        await autoConnect();

        // Automatically connect/disconnect on plugin
        new AdbWebUsbBackendWatcher(async (id) => {
          if(!id) {
            dispatch(disconnected());
          } else {
            await autoConnect();
          }
        });
      }
    };
    getDevices();
  }, [isConnected, connectToDevice, dispatch]);

  const handleDeviceConnect = useCallback(async() => {
    dispatch(connecting());

    try {
      const device = await AdbWebUsbBackend.requestDevice();
      await connectToDevice(device);
    } catch(e) {
      console.log(e);
      dispatch(connectionFailed());
    }
  }, [connectToDevice, dispatch]);

  return (
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header
        deviceName={(isConnected && adb) ? adb.getDevice() : null}
      />

      <Stack spacing={3}>
        <Device
          error={error}
          handleDeviceConnect={handleDeviceConnect}
        />
      </Stack>

      <Routes>
        {isConnected &&
          <>
            <Route
              element={<Home />}
              path="/"
            />

            {adb &&
              <>
                <Route
                  element={<Cli adb={adb} />}
                  path="cli"
                />

                <Route
                  element={<Setup />}
                  path="wtfos"
                />

                <Route
                  element={<Remove adb={adb} />}
                  path="wtfos/remove"
                />

                <Route
                  element={<Install adb={adb} />}
                  path="wtfos/install"
                />

                <Route
                  element={<Update adb={adb} />}
                  path="wtfos/update"
                />

                <Route
                  element={<Packages adb={adb} />}
                  path="packages"
                />

                <Route
                  element={<Startup adb={adb} />}
                  path="startup"
                />


              </>}
          </>}
      </Routes>
    </Container>
  );
}

export default App;
