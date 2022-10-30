import React from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Recovery from "../disclaimer/Recovery";
import SetupHint from "../setup/SetupHint";
import Tiles from "./Tiles";

import {
  selectConnected,
  selectHasOpkgBinary,
} from "../device/deviceSlice";
import { selectDisclaimersStatus } from "../settings/settingsSlice";

export default function Main() {
  const { t } = useTranslation("home");

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isConnected = useSelector(selectConnected);
  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  return(
    <Stack
      marginBottom={2}
      spacing={2}
    >
      {isConnected &&
        <Alert severity="success">
          <Typography>
            {t("connected")}
          </Typography>
        </Alert>}

      <Stack>
        <Tiles />
      </Stack>

      {!hasOpkgBinary && isConnected &&
        <SetupHint />}

      {!disclaimersStatus &&
        <Recovery />}
    </Stack>
  );
}
