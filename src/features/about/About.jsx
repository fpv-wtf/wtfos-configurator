import React from "react";

import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import Team from "./Team";
import Support from "./Support";

export default function About() {

  return(
    <Stack
      marginBottom={2}
      marginTop={2}
      spacing={2}
    >

      <Typography 
        component="div"
        variant="h5"  
      >
        Support the effort
      </Typography>

      <Support />

      <Typography 
        component="div"
        variant="h5"  
      >
        Team
      </Typography>

      <Team />
    </Stack>
  );
}
