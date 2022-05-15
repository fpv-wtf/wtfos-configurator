import React from "react";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import json from "../../../package.json";

export default function Footer() {
  const version = json.version;

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
                If you run into any issues, please&nbsp;
                <Link href="https://github.com/fpv-wtf/wtfos-configurator/issues">
                  report them on github
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
