import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";

import { selectAdbDetectionFailed } from "./deviceSlice";

export default function AdbDetectionError() {
  const { t } = useTranslation("common");
  const adbDetectionFailed = useSelector(selectAdbDetectionFailed);

  if(!adbDetectionFailed) {
    return null;
  }

  return (
    <Alert severity="error">
      {t("adbDetectionFailed")}
    </Alert>
  );
}
