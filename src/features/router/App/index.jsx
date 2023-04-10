import PropTypes from "prop-types";
import React, { useEffect } from "react";
import {
  useSelector, useDispatch,
} from "react-redux";

import {
  Routes,
  Route,
} from "react-router-dom";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import "./App.css";

import Claimed from "../../overlays/Claimed";
import Cli from "../../cli/Cli";
import Device from "../../device/Device";
import Error404 from "../../404/404";
import Header from "../../navigation/Header";
import Healthcheck from "../../healthcheck/Healthcheck";
import Install from "../../setup/Install";
import Home from "../../home/Main";
import Package from "../../package/Package";
import Packages from "../../packages/Packages";
import Remove from "../../setup/Remove";
import Setup from "../../setup/Setup";
import Startup from "../../startup/Startup";
import Update from "../../setup/Update";

import {
  selectConnected,
  selectError,
} from "../../device/deviceSlice";

import {
  fetchUpgradable,
  selectFetchedUpgradable,
} from "../../packages/packagesSlice";

import { selectPassed } from "../../healthcheck/healthcheckSlice";

import { selectCanClaim } from "../../tabGovernor/tabGovernorSlice";

function App({
  adb,
  adbDetection,
  handleAdbConnectClick,
}) {
  const dispatch = useDispatch();

  const error = useSelector(selectError);
  const isConnected = useSelector(selectConnected);
  const healthchecksPassed = useSelector(selectPassed);
  const fetchedUpgradable = useSelector(selectFetchedUpgradable);

  const canClaim = useSelector(selectCanClaim);

  useEffect(() => {
    if(adb && !fetchedUpgradable) {
      dispatch(fetchUpgradable(adb));
    }
  }, [adb, dispatch, fetchedUpgradable]);

  return (
    <Container
      fixed
      sx={{ mb: 8 }}
    >
      <Header />

      {!isConnected &&
        <Stack>
          <Device
            adbDetection={adbDetection}
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
          element={(isConnected && adb) ? <Package adb={adb} /> : null}
          path="package/:repo/:packageSlug"
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

      {!canClaim &&
        <Claimed />}
    </Container>
  );
}

App.defaultProps = { adb: null };

App.propTypes = {
  adb: PropTypes.shape(),
  adbDetection: PropTypes.bool.isRequired,
  handleAdbConnectClick: PropTypes.func.isRequired,
};

export default App;
