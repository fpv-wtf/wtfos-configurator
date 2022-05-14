import React from "react";

import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

export default function Disclaimer() {
  return(
    <Alert severity="error">
      <Typography sx={{ fontWeight: "bold" }}>
        Browser not supported!
      </Typography>

      <Typography>
        Your browser does not support webusb functionality. Please use a &nbsp;
        <Link href="https://caniuse.com/webusb">
          browser which provides this functionality.
        </Link>
      </Typography>

      <Typography>
        Supported (and tested) browsers are:
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
          Some Android phones
        </ListItem>

        <ListItem dense>
          Other Chromium based browsers
        </ListItem>
      </List>
    </Alert>
  );
}
