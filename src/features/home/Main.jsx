import React from "react";

import { useSelector } from "react-redux";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

import Recovery from "../disclaimer/Recovery";
import SetupHint from "../setup/SetupHint";
import Tiles from "./Tiles";

import {
  selectConnected,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

export default function Main() {
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isConnected = useSelector(selectConnected);

  return(
    <Stack
      marginBottom={2}
      spacing={2}
    >
      {isConnected &&
        <Alert severity="success">
          Successfully connected to your device.
        </Alert>}

      <Stack>
        <Tiles />
      </Stack>

      {!hasOpkgBinary && isConnected &&
        <SetupHint />}

      <Recovery />
    </Stack>
  );
}
