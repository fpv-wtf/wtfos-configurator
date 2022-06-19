import React from "react";
import { useTranslation } from "react-i18next";

import Link from "@mui/material/Link";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

export default function SetupHint() {
  const { t } = useTranslation("setup");

  return(
    <Alert severity="warning">
      <Typography>
        {t("hint1")}
        &nbsp;
        <Link href="/wtfos/install">
          {t("hint2")}
        </Link>
        .
        &nbsp;
        {t("hint3")}
      </Typography>
    </Alert>
  );
}
