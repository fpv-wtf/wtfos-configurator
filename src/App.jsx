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

import Healthcheck from "./features/healthcheck/Healthcheck";

import {
  selectConnected,
  selectError,
} from "./features/device/deviceSlice";

import { selectPassed } from "./features/healthcheck/healthcheckSlice";

function App({
  adb,
  handleAdbConnectClick,
}) {
  const error = useSelector(selectError);
  const isConnected = useSelector(selectConnected);
  const healthchecksPassed = useSelector(selectPassed);

  return (
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header />

      {!isConnected  &&
        <Stack>
          <Device
            error={error}
            handleDeviceConnect={handleAdbConnectClick}
          />
        </Stack>}

      {!healthchecksPassed && isConnected && adb &&
        <Healthcheck adb={adb} />}

      <Routes>
        <Route
          element={<Home />}
          path="/"
        />

        <Route
          element={(isConnected && adb) ? <Cli adb={adb} /> : null}
          path="cli"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected) ? <Setup /> : null}
          path="wtfos"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected && adb) ? <Remove adb={adb} /> : null}
          path="wtfos/remove"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected && adb) ? <Install adb={adb} /> : null}
          path="wtfos/install"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected && adb) ? <Update adb={adb} /> : null}
          path="wtfos/update"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected && adb) ? <Packages adb={adb} /> : null}
          path="packages"
          render={isConnected && adb}
        />

        <Route
          element={(isConnected && adb) ? <Startup adb={adb} /> : null}
          path="startup"
          render={isConnected && adb}
        />

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
