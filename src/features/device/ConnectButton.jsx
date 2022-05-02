import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

import Button from "@mui/material/Button";

import { selectStatus } from "./deviceSlice";

export default function ConnectButton({ onClick }) {
  const status = useSelector(selectStatus);

  return (
    <Button
      disabled={status !== "idle"}
      onClick={onClick}
      variant="contained"
    >
      Connect to Device
    </Button>
  );
}

ConnectButton.propTypes = { onClick: PropTypes.func.isRequired };
