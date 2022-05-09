import React from "react";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Team from "./Team";
import Support from "./Support";

export default function About() {

  return(
    <Stack
      marginBottom={2}
      marginTop={2}
    >

      <Typography
        component="div"
        variant="h5"
      >
        Support the effort
      </Typography>

      <Stack
        marginBottom={2}
        marginTop={2}
      >
        <Support />
      </Stack>

      <Typography
        component="div"
        variant="h5"
      >
        Team
      </Typography>

      <Stack
        marginBottom={2}
        marginTop={2}
      >
        <Team />
      </Stack>
    </Stack>
  );
}
