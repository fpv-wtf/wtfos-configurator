import React from "react";

import Link from "@mui/material/Link";

import Alert from "@mui/material/Alert";

export default function SetupHint() {
  return(
    <Alert severity="warning">
      It seems that you have not completed the&nbsp;
      <Link href="/setup">
        basic setup
      </Link>
      , this is needed in order to fully benefit from the configurator.
    </Alert>
  );
}
