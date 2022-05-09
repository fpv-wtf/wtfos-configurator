import React from "react";
import { useSelector } from "react-redux";

import Grid from "@mui/material/Grid";

import DownloadIcon from "@mui/icons-material/Download";
import HelpIcon from "@mui/icons-material/Help";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StartIcon from "@mui/icons-material/Start";
import TerminalIcon from "@mui/icons-material/Terminal";

import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as AlienSvg } from "../../assets/icons/alien-white.svg";


import Tile from "../tile/Tile";

import {
  selectConnected,
  selectHasDinitBinary,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

export default function Tiles() {
  const isConnected = useSelector(selectConnected);
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
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="Expand functionality of your devive by installing additional packages developed by the community."
          disabled={!hasOpkgBinary || !isConnected}
          linkTo="packages"
          title="Package Manager"
        >
          <DownloadIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="Manage applications that should be run on startup to permanently enable functionality once the device is powered up."
          disabled={!hasDinitBinary || !isConnected}
          linkTo="startup"
          title="Startup"
        >
          <StartIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="Interactive Shell Session. Run commands as you please, you should be knowing what you are doing."
          disabled={!isConnected}
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
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="Install, maintain or Remove WTFOS - the operating system for all community contributed functionality."
          disabled={!isConnected}
          linkTo="wtfos"
          title="WTFOS"
        >
          <RocketLaunchIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="If you have any feedback, questions or want to contribute additional functionality, join our community on Discord."
          href="https://discord.com/invite/3rpnBBJKtU"
          title="Support"
        >
          <HelpIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description="fpv.wtf is a group of enthusiasts working to improve the digital FPV experience."
          linkTo="about"
          title="About fpv.wtf"
        >
          <SvgIcon
            component={AlienSvg}
            fontSize="large"
          />
        </Tile>
      </Grid>
    </Grid>
  );
}
