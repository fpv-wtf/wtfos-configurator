import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

import Button from "@mui/material/Button";

import { selectConnected } from "./deviceSlice";

export default function ConnectButton({ onClick }) {
  const connected = useSelector(selectConnected);

  return (
    <Button
      disabled={connected || !window.navigator.usb}
      onClick={onClick}
      variant="contained"
    >
      Connect to Device
    </Button>
  );
}

ConnectButton.propTypes = { onClick: PropTypes.func.isRequired };
