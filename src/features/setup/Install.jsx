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

export default function Install({ adb }) {
  const { t } = useTranslation("setup");
  const dispatch = useDispatch();

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isProcessing = useSelector(selectProcessing);
  const deviceName = useSelector(selectNiceName);

  const onClick = useCallback(async (device) => {
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
  }, [adb, dispatch]);

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

      <Button
        disabled={hasOpkgBinary || isProcessing}
        onClick={onClick}
        variant="contained"
      >
        {t("install")}
      </Button>

      <Log />
    </Stack>
  );
}

Install.propTypes = { adb: PropTypes.shape().isRequired };
