import React from "react";

import Link from "@mui/material/Link";

import Alert from "@mui/material/Alert";

export default function SetupHint() {
  return(
    <Alert severity="warning">
      You should &nbsp;
      <Link href="/setup">
        install WTFOS now
      </Link>
      . This is required for adding new packages and service management.
    </Alert>
  );
}
