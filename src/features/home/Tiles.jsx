import React from "react";
import { useSelector } from "react-redux";

import Grid from "@mui/material/Grid";

import DownloadIcon from "@mui/icons-material/Download";
import HelpIcon from "@mui/icons-material/Help";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StartIcon from "@mui/icons-material/Start";
import TerminalIcon from "@mui/icons-material/Terminal";

import Tile from "../tile/Tile";

import {
  selectHasDinitBinary,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

export default function Tiles() {
  const hasDinitBinary = useSelector(selectHasDinitBinary);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);

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
          disabled={!hasOpkgBinary}
          linkTo="packages"
          title="Package Manager"
        >
          <DownloadIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        xs={3}
      >
        <Tile
          description="Manage applications that should be run on startup to permanently enable functionality once the device is powered up."
          disabled={!hasDinitBinary}
          linkTo="startup"
          title="Startup"
        >
          <StartIcon fontSize="large" />
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
          description="Install, maintain or Remove WTFOS - the operating system for all community contributet functionality."
          linkTo="wtfos"
          title="WTFOS"
        >
          <RocketLaunchIcon fontSize="large" />
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
          <HelpIcon fontSize="large" />
        </Tile>
      </Grid>
    </Grid>
  );
}
