import React from "react";

import Link from "@mui/material/Link";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

export default function SetupHint() {
  return(
    <Alert severity="warning">
      <Typography>
        You should &nbsp;
        <Link href="/wtfos/install">
          install WTFOS now
        </Link>
        . This is required for adding new packages and service management.
      </Typography>
    </Alert>
  );
}
