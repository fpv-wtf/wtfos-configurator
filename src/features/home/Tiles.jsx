import React from "react";

import Grid from "@mui/material/Grid";

import DownloadIcon from "@mui/icons-material/Download";
import HelpIcon from "@mui/icons-material/Help";
import StartIcon from "@mui/icons-material/Start";
import TerminalIcon from "@mui/icons-material/Terminal";

import Tile from "./Tile";

export default function Tiles() {
  return(
    <Grid
      alignItems="stretch"
      container
      spacing={2}
    >
      <Grid
        item
        xs={3}
      >
        <Tile
          description="Expand functionality of your devive by installing additional packages developed by the community."
          linkTo="packages"
          title="Package Manager"
        >
          <DownloadIcon
            fontSize="large"
          />
        </Tile>
      </Grid>

      <Grid
        item
        xs={3}
      >
        <Tile
          description="Manage applications that should be run on startup to permanently enable functionality once the device is powered up."
          title="Startup"
        >
          <StartIcon
            fontSize="large"
          />
        </Tile>
      </Grid>

      <Grid
        item
        xs={3}
      >
        <Tile
          description="Interactive Shell Session. Run commands as you please, you should be knowing what you are doing."
          linkTo="cli"
          title="CLI"
        >
          <TerminalIcon
            fontSize="large"
          />
        </Tile>
      </Grid>

      <Grid
        item
        xs={3}
      >
        <Tile
          description="If you have any feedback, questions or want to contribute additional functionality, join our community on Discord."
          href="https://google.com"
          title="Support"
        >
          <HelpIcon
            fontSize="large"
          />
        </Tile>
      </Grid>
    </Grid>
  );
}
