import React from "react";
import { useSelector } from "react-redux";

import Grid from "@mui/material/Grid";

import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateIcon from "@mui/icons-material/Update";

import Tile from "../tile/Tile";

import {
  selectHasDinitBinary,
  selectHasOpkgBinary,
} from "../device/deviceSlice";
import { t } from "i18next";

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
          disabled={!hasDinitBinary}
          linkTo="/wtfos/update"
          title={t("tileUpdateTitle")}
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
