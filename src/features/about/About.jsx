import PropTypes from "prop-types";
import React from "react";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Header from "../navigation/Header";
import Team from "./Team";
import Support from "./Support";

export default function About({ adb }) {
  return(
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header
        deviceName={(adb) ? adb.getDevice() : "No device found"}
      />

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
    </Container>
  );
}

About.defaultProps = { adb: null };

About.propTypes = { adb: PropTypes.shape() };
