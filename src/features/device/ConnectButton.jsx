import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Button from "@mui/material/Button";

import { selectConnected } from "./deviceSlice";

import { selectClaimed } from "../device/deviceSlice";

export default function ConnectButton({ onClick }) {
  const { t } = useTranslation("common");
  const connected = useSelector(selectConnected);
  const claimed = useSelector(selectClaimed);

  return (
    <Button
      disabled={claimed || connected || !window.navigator.usb}
      onClick={onClick}
      variant="contained"
    >
      {t("connectDevice")}
    </Button>
  );
}

ConnectButton.propTypes = { onClick: PropTypes.func.isRequired };
