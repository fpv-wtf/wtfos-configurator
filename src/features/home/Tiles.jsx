import React, {
  useRef, useEffect,
} from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import autoAnimate from "@formkit/auto-animate";

import Grid from "@mui/material/Grid";
import DownloadIcon from "@mui/icons-material/Download";
import HelpIcon from "@mui/icons-material/Help";
import InfoIcon from "@mui/icons-material/Info";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import StartIcon from "@mui/icons-material/Start";
import UpdateIcon from "@mui/icons-material/Update";
import TerminalIcon from "@mui/icons-material/Terminal";
import AccessibilityNewIcon from "@mui/icons-material/AccessibilityNew";
import Badge from "@mui/material/Badge";

import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as AlienSvg } from "../../assets/icons/alien-white.svg";

import Tile from "../tile/Tile";

import {
  selectConnected,
  selectHasAdb,
  selectHasDinitBinary,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

import { selectUpgradable } from "../packages/packagesSlice";

export default function Tiles() {
  const { t } = useTranslation("home");

  const gridParent = useRef(null);

  const hasAdb = useSelector(selectHasAdb);
  const hasDinitBinary = useSelector(selectHasDinitBinary);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isConnected = useSelector(selectConnected);

  const upgradable = useSelector(selectUpgradable);

  useEffect(() => {
    gridParent.current && autoAnimate(gridParent.current);
  }, [gridParent]);

  return(
    <Grid
      alignItems="stretch"
      container
      ref={gridParent}
      spacing={2}
    >
      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description={t("tilePackageManagerDescription")}
          disabled={!hasOpkgBinary || !isConnected}
          linkTo="packages"
          title={t("tilePackageManagerTitle")}
        >
          <DownloadIcon fontSize="large" />
        </Tile>
      </Grid>

      {hasAdb && upgradable.length > 0 && (
        <Grid
          item
          md={3}
          sm={6}
          xs={12}
        >
          <Tile
            description={t("tileUpdateDescription")}
            disabled={!hasDinitBinary}
            linkTo="/wtfos/update"
            title={
              <Badge
                badgeContent={upgradable.length}
                color="secondary"
              >
                {t("tileUpdateTitle")}
              </Badge>
            }
          >

            <UpdateIcon fontSize="large" />
          </Tile>
        </Grid>
      )}

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description={t("tileStartupDescription")}
          disabled={!hasDinitBinary || !isConnected}
          linkTo="startup"
          title={t("tileStartupTitle")}
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
          description={t("tileCliDescription")}
          disabled={!isConnected}
          linkTo="cli"
          title={t("tileCliTitle")}
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
          description={t("tileWtfosDescription")}
          disabled={!isConnected}
          linkTo="wtfos"
          title={t("tileWtfosTitle")}
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
          description={t("tileRootDescription")}
          disabled={isConnected && hasAdb}
          linkTo="root"
          title={t("tileRootTitle")}
        >
          <AccessibilityNewIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description={t("tileWikiDescription")}
          href="https://github.com/fpv-wtf/wtfos/wiki"
          title={t("tileWikiTitle")}
        >
          <InfoIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description={t("tileSupportDescription")}
          href="https://discord.com/invite/3rpnBBJKtU"
          title={t("tileSupportTitle")}
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
          description={t("tileAboutDescription")}
          linkTo="about"
          title={t("tileAboutTitle")}
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
