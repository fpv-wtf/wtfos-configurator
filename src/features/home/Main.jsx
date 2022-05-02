import React from "react";

import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";

import Tiles from "./Tiles";

export default function Main() {
  console.log("Main");
  return(
    <>
      <Stack
        marginBottom={2}
        spacing={2}
      >
        <Grid
          container
          spacing={3}
        >
          <Grid
            item
            xs={12}
          >
            <Alert severity="success">
              Successfully connected to your device.
            </Alert>
          </Grid>
        </Grid>


      </Stack>

      <Tiles />
    </>
  );
}
