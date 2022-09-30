import React from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Grid from "@mui/material/Grid";

import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateIcon from "@mui/icons-material/Update";
import Badge from "@mui/material/Badge";

import Tile from "../tile/Tile";

import {
  selectHasAdb,
  selectHasDinitBinary,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

import { selectUpgradable } from "../packages/packagesSlice";

export default function Tiles() {
  const { t } = useTranslation("setup");
  const hasDinitBinary = useSelector(selectHasDinitBinary);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const hasAdb = useSelector(selectHasAdb);
  const upgradable = useSelector(selectUpgradable);

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
          description={t("tileInstallDescription")}
          disabled={hasOpkgBinary}
          linkTo="/wtfos/install"
          title={t("tileInstallTitle")}
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
          description={t("tileUpdateDescription")}
          disabled={!hasDinitBinary || !upgradable.length > 0 || !hasAdb}
          linkTo="/wtfos/update"
          title={upgradable.length > 0 ? (
            <Badge
              badgeContent={upgradable.length}
              color="secondary"
            >
              {t("tileUpdateTitle")}
            </Badge>
          ) : t("tileUpdateTitle")}
        >
          <UpdateIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        md={3}
        sm={6}
        xs={12}
      >
        <Tile
          description={t("tileRemoveDescription")}
          disabled={!hasDinitBinary}
          linkTo="/wtfos/remove"
          title={t("tileRemoveTitle")}
        >
          <DeleteIcon fontSize="large" />
        </Tile>
      </Grid>
    </Grid>
  );
}
