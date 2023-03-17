import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import json from "../../../package.json";
import { loadTraceId } from "../../utils/LocalStorage";

export default function Footer() {
  const { t } = useTranslation("navigation");
  const version = json.version;
  const traceId = loadTraceId();

  return(
    <Box
      sx={{
        bottom: 0,
        position: "fixed",
        width: "100%",
      }}
    >
      <Container fixed>
        <Paper elevation={1}>
          <Grid
            container
          >
            <Grid
              item
              xs={6}
            >
              <Typography
                margin={1}
                variant="body2"
              >
                v
                {version}
                &nbsp;- Trace ID:&nbsp;

                {traceId}
              </Typography>
            </Grid>

            <Grid
              item
              xs={6}
            >
              <Typography
                align="right"
                margin={1}
                variant="body2"
              >
                {t("footerIssue")}
                &nbsp;
                <Link href="https://github.com/fpv-wtf/wtfos-configurator/issues">
                  {t("footerIssueLink")}
                </Link>
                .

                {t("footerDiscord")}
                &nbsp;
                <Link href="https://discord.com/invite/3rpnBBJKtU">
                  {t("footerDiscordLink")}
                </Link>
                .
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
