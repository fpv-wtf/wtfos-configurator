import React from "react";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Link from "../styledLink/Default";

export default function SetupHint() {
  const { t } = useTranslation("setup");

  return(
    <Alert severity="warning">
      <Typography>
        {t("hint1")}
        &nbsp;
        <Link
          text={t("hint2")}
          to="/wtfos/install"
        />
        .
        &nbsp;
        {t("hint3")}
      </Typography>
    </Alert>
  );
}
