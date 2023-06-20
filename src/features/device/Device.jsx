import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ConnectButton from "./ConnectButton";
import Spinner from "../loading/Spinner";
import Webusb from "../disclaimer/Webusb";
import Udev from "../disclaimer/Udev";

import AdbDetectionError from "./AdbDetectionError";

import { isLinux } from "../../utils/Os";

import {
  selectAdbDetectionFailed,
  selectRebooting,
} from "./deviceSlice";

import { selectUpdate } from "../packages/packagesSlice";

export default function Device({
  adbDetection,
  error,
  handleDeviceConnect,
}) {
  const { t } = useTranslation("error");

  const translation = useTranslation("common");
  const tc = translation.t;

  const isRebooting = useSelector(selectRebooting);
  const adbConnectionFailed = useSelector(selectAdbDetectionFailed);
  const update = useSelector(selectUpdate);

  let content = (
    <Stack
      marginBottom={2}
      spacing={2}
      sx={{ width: "100%" }}
    >

      {!window.navigator.usb &&
        <Webusb />}

      {(update.waitingOnPostUpdateReboot || update.postUpdateRebootDone) &&
        <Alert severity="info">
          <Typography>
            {tc("rebooting")}
          </Typography>
        </Alert>}

      {(!update.waitingOnPostUpdateReboot && !update.postUpdateRebootDone) &&
        <>
          <AdbDetectionError />

          {adbDetection &&
            <Alert severity="info">
              <Typography>
                {tc("adbCheck")}
              </Typography>
            </Alert>}

          {!error && window.navigator.usb && !adbDetection && !adbConnectionFailed &&
            <Alert severity="warning">
              <Typography>
                {t("warningConnection")}
              </Typography>
            </Alert>}

          { error &&
            <Alert severity="error">
              <Typography>
                {t("errorConnection")}
              </Typography>
            </Alert>}

          { isLinux() && !update.waitingOnPostUpdateReboot &&
            <Udev />}

          {!adbDetection && !adbConnectionFailed &&
            <ConnectButton onClick={handleDeviceConnect} />}
        </>}
    </Stack>
  );

  if(isRebooting) {
    content = <Spinner text={tc("rebooting")} />;
  }

  return content;
}

Device.defaultProps = { error: false };

Device.propTypes = {
  adbDetection: PropTypes.bool.isRequired,
  error: PropTypes.bool,
  handleDeviceConnect: PropTypes.func.isRequired,
};
