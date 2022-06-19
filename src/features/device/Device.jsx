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

import { selectRebooting } from "./deviceSlice";

export default function Device({
  error,
  handleDeviceConnect,
}) {
  const { t } = useTranslation("error");

  const translation = useTranslation("common");
  const tc = translation.t;

  const isRebooting = useSelector(selectRebooting);

  let content = (
    <Stack
      marginBottom={2}
      spacing={2}
      sx={{ width: "100%" }}
    >

      {!window.navigator.usb &&
        <Webusb />}

      { !error && window.navigator.usb &&
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

      <ConnectButton onClick={handleDeviceConnect} />
    </Stack>
  );

  if(isRebooting) {
    content = <Spinner text={tc("rebooting")} />;
  }

  return content;
}

Device.defaultProps = { error: false };

Device.propTypes = {
  error: PropTypes.bool,
  handleDeviceConnect: PropTypes.func.isRequired,
};
