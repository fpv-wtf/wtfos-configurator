import React from "react";

import { useSelector } from "react-redux";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

import SetupHint from "../setup/SetupHint";
import Tiles from "./Tiles";

import { selectHasOpkgBinary } from "../device/deviceSlice";

export default function Main() {
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);

  return(
    <Stack
      marginBottom={2}
      spacing={2}
    >
      <Alert severity="success">
        Successfully connected to your device.
      </Alert>

      <Stack>
        <Tiles />
      </Stack>

      {!hasOpkgBinary &&
        <SetupHint />}
    </Stack>
  );
}
