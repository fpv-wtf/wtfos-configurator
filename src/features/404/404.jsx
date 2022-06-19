import React from "react";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

export default function Error404() {
  const { t } = useTranslation("error");

  return(
    <Alert severity="error">
      <Typography sx={{ fontWeight: "bold" }}>
        {t("error404Title")}
      </Typography>

      <Typography>
        {t("error404Text")}
        &nbsp;
        <Link href="/">
          {t("error404Link")}
        </Link>
        .
      </Typography>
    </Alert>
  );
}
