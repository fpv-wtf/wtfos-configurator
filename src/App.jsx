import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

import {
  Routes,
  Route,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import "./App.css";

import Device from "./features/device/Device";
import Header from "./features/navigation/Header";

import Cli from "./features/cli/Cli";
import Home from "./features/home/Main";
import Packages from "./features/packages/Packages";
import Startup from "./features/startup/Startup";

import Error404 from "./features/404/404";
import Setup from "./features/setup/Setup";
import Install from "./features/setup/Install";
import Remove from "./features/setup/Remove";
import Update from "./features/setup/Update";

import {
  selectConnected,
  selectError,
} from "./features/device/deviceSlice";

function App({
  adb,
  handleAdbConnectClick,
}) {
  const isConnected = useSelector(selectConnected);
  const error = useSelector(selectError);

  return (
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header
        deviceName={(isConnected && adb) ? adb.getDevice() : "No device found"}
      />

      {!isConnected  &&
        <Stack>
          <Device
            error={error}
            handleDeviceConnect={handleAdbConnectClick}
          />
        </Stack>}

      <Routes>
        <Route
          element={<Home />}
          path="/"
        />

        {isConnected && adb &&
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

        <Route
          element={<Error404 />}
          path="/*"
        />
      </Routes>
    </Container>
  );
}

App.defaultProps = { adb: null };

App.propTypes = {
  adb: PropTypes.shape(),
  handleAdbConnectClick: PropTypes.func.isRequired,
};

export default App;
