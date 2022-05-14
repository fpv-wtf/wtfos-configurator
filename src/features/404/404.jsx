import React from "react";

import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

export default function Error404() {
  return(
    <Alert severity="error">
      <Typography sx={{ fontWeight: "bold" }}>
        404 - Not found
      </Typography>

      <Typography>
        Not sure what you were looking for, but this page does not exist. Maybe check the&nbsp;
        <Link href="/">
          homepage
        </Link>
        .
      </Typography>
    </Alert>
  );
}
