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

  const errorText = error.map((line) => {
    return (
      <Typography key={line}>
        {line}
      </Typography>
    );
  });

  const hasInstallationError =
    errors.removePackage ||
    errors.installPackage ||
    errors.fetchPackages;
  let errorHeadline = t("removePackageFailed");
  if(errors.installPackage) {
    errorHeadline = t("installPackageFailed");
  } else if (errors.fetchPacakge) {
    errorHeadline = t("fetchPackageFailed");
  }

  if(!hasInstallationError) {
    return null;
  }

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
