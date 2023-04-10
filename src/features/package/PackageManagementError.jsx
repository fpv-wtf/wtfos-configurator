import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import {
  selectError,
  selectErrors,
} from "../packages/packagesSlice";

export default function PackageManagementError() {
  const { t } = useTranslation("package");

  const error = useSelector(selectError);
  const errors = useSelector(selectErrors);

  const hasInstallationError =
    errors.removePackage ||
    errors.installPackage ||
    errors.fetchPackages ||
    errors.fetchUpgradable ||
    errors.upgrade;

  let errorHeadline = t("removePackageFailed");
  if(errors.installPackage) {
    errorHeadline = t("installPackageFailed");
  } else if(errors.fetchPackages) {
    errorHeadline = t("fetchPackagesFailed");
  } else if(errors.upgrade) {
    errorHeadline = t("upgradeFailed");
  } else if(errors.fetchUpgradable) {
    errorHeadline = t("fetchUpgradableFailed");
  }

  if(!hasInstallationError) {
    return null;
  }

  const errorText = error.map((line) => {
    return (
      <Typography key={line}>
        {line}
      </Typography>
    );
  });

  return (
    <Alert
      severity="error"
      sx={{ marginBottom: 2 }}
    >
      <Typography sx={{ marginBottom: 1 }}>
        {errorHeadline}
      </Typography>

      {errorText}
    </Alert>
  );
}
