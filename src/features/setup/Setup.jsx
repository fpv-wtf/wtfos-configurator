import React from "react";
import Stack from "@mui/material/Stack";

import Recovery from "../disclaimer/Recovery";
import Tiles from "./Tiles";

export default function Setup() {
  return (
    <Stack spacing={2}>
      <Tiles />

      <Recovery />
    </Stack>
  );
}
