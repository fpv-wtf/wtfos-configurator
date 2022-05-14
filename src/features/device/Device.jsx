import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

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
            Connect your rooted goggles or airunit via USB, make sure they are powered and hit the connect button.
          </Typography>
        </Alert>}

      { error &&
        <Alert severity="error">
          <Typography>
            Could not connect to device, make sure that no other adb server is running on your machine and that you are not connected in another tab/window.
          </Typography>
        </Alert>}

      <ConnectButton onClick={handleDeviceConnect} />
    </Stack>
  );

  if(isRebooting) {
    content = <Spinner text="Rebooting..." />;
  }

  return content;
}

Device.defaultProps = { error: false };

Device.propTypes = {
  error: PropTypes.bool,
  handleDeviceConnect: PropTypes.func.isRequired,
};
