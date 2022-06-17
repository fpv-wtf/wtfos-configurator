import React from "react";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

export default function Disclaimer() {
  const { t } = useTranslation("disclaimer");

  return(
    <Alert severity="error">
      <Typography sx={{ fontWeight: "bold" }}>
        {t("browserNotSupported")}
      </Typography>

      <Typography>
        {t("browserNotSupportedText")}
        &nbsp;
        <Link href="https://caniuse.com/webusb">
          {t("browserNotSupportedLink")}
        </Link>
      </Typography>

      <Typography>
        {t("browserSupported")}
      </Typography>

      <List>
        <ListItem dense>
          Chrome
        </ListItem>

        <ListItem dense>
          Vivaldi
        </ListItem>

        <ListItem dense>
          Edge
        </ListItem>

        <ListItem dense>
          {t("browserSupportedAndroid")}
        </ListItem>

        <ListItem dense>
          {t("browserSupportedOther")}
        </ListItem>
      </List>
    </Alert>
  );
}
