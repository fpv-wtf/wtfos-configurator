import React from "react";
import { useTranslation } from "react-i18next";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Header from "../navigation/Header";
import Team from "./Team";
import Support from "./Support";

export default function About() {
  const { t } = useTranslation("about");

  return(
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Header />

      <Stack
        marginBottom={2}
        marginTop={2}
      >
        <Typography
          component="div"
          variant="h5"
        >
          {t("support")}
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
          {t("team")}
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
