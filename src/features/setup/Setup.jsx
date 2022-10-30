import React from "react";
import { useSelector } from "react-redux";
import Stack from "@mui/material/Stack";

import Recovery from "../disclaimer/Recovery";
import Tiles from "./Tiles";

import { selectDisclaimersStatus } from "../settings/settingsSlice";

export default function Setup() {
  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  return (
    <Stack spacing={2}>
      <Tiles />

      {!disclaimersStatus &&
        <Recovery />}
    </Stack>
  );
}
