import PropTypes from "prop-types";
import React, {
  useEffect,
  useCallback,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import ReactGA from "react-ga4";

import Disclaimer from "../disclaimer/Disclaimer";
import Healthcheck from "./healthcheck/Healthcheck";
import Log from "../log/Log";

import {
  appendToLog,
  checkBinaries,
  clearLog,
  rebooting,
  selectHasOpkgBinary,
  selectNiceName,
} from "../device/deviceSlice";

import {
  installWTFOS,
  selectProcessing,
} from "../packages/packagesSlice";

import { selectPassed } from "./healthcheck/healthcheckSlice";

export default function Install({ adb }) {
  const { t } = useTranslation("setup");
  const dispatch = useDispatch();

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isProcessing = useSelector(selectProcessing);
  const deviceName = useSelector(selectNiceName);
  const healthchecksPassed = useSelector(selectPassed);

  const handleInstall = useCallback(async (device) => {
    ReactGA.gtag("event", "installWtfosTriggered", { deviceName });

    dispatch(clearLog());
    dispatch(installWTFOS({
      adb,
      callback: (message) => {
        dispatch(appendToLog(message));
      },
      setRebooting: () => {
        ReactGA.gtag("event", "installWtfosDone", { deviceName });

        dispatch(rebooting(true));
      },
    }));
  }, [adb, deviceName, dispatch]);

  useEffect(() => {
    dispatch(checkBinaries(adb));
  }, [adb, dispatch, isProcessing]);

  return(
    <Stack spacing={2}>
      <Disclaimer
        lines={[
          t("installDisclaimerLine1"),
          t("installDisclaimerLine2"),
          t("installDisclaimerLine3"),
        ]}
        title={t("installDisclaimerTitle")}
      />

      {!healthchecksPassed &&
        <Healthcheck
          adb={adb}
          appendToLog={appendToLog}
          clearLog={clearLog}
        />}

      <Button
        disabled={hasOpkgBinary || isProcessing || !healthchecksPassed}
        onClick={handleInstall}
        variant="contained"
      >
        {t("install")}
      </Button>

      <Log />
    </Stack>
  );
}

Install.propTypes = { adb: PropTypes.shape().isRequired };
