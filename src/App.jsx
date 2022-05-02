import React, {
  useCallback,
  useState,
}  from "react";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import AdbWebCredentialStore from "@yume-chan/adb-credential-web";
import AdbWebUsbBackend from "@yume-chan/adb-backend-webusb";
import { Adb } from "@yume-chan/adb";
import {
  Routes,
  Route,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

import "./App.css";

import AdbWrapper from "./utils/AdbWrapper";

import Device from "./features/device/Device";
import Header from "./features/header/Header";

import Cli from "./features/cli/Cli";
import Home from "./features/home/Main";
import Packages from "./features/packages/Packages";
import Startup from "./features/startup/Startup";

import {
  connected,
  connecting,
  connectionFailed,
  selectConnected,
  selectError,
} from "./features/device/deviceSlice";

function App() {
  const dispatch = useDispatch();
  const isConnected = useSelector(selectConnected);
  const error = useSelector(selectError);

  const [adb, setAdb] = useState(null);

  const handleDeviceConnect = useCallback(async() => {
    dispatch(connecting());
    const credentialStore = new AdbWebCredentialStore();
    try {
      const device = await AdbWebUsbBackend.requestDevice();
      const streams = await device.connect();
      const adbLocal = await Adb.authenticate(streams, credentialStore, undefined);
      const adbWrapper = new AdbWrapper(adbLocal);

      const result = await adbWrapper.establishReverseSocket(1);
      console.log("Reverse socket result", result);

      setAdb(adbWrapper);
      dispatch(connected());
    } catch(e) {
      console.log(e);
      dispatch(connectionFailed());
    }
  }, [dispatch]);

  return (
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header
        deviceName={(isConnected && adb) ? adb.getDevice() : null}
      />

      <Grid
        container
        spacing={3}
      >
        <Grid
          item
          xs={12}
        >
          <Device
            error={error}
            handleDeviceConnect={handleDeviceConnect}
          />
        </Grid>
      </Grid>

      {isConnected &&
        <Routes>
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
                element={<Packages adb={adb} />}
                path="packages"
              />

              <Route
                element={<Startup adb={adb} />}
                path="startup"
              />
            </>}
        </Routes>}
    </Container>
  );
}

export default App;
