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
          description="Install WTFOS to your device to install community contrsibuted software."
          disabled={hasOpkgBinary}
          linkTo="/wtfos/install"
          title="Install"
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
          description="Update WTFOS and installed packages to stay up to date."
          disabled={!hasDinitBinary}
          linkTo="/wtfos/update"
          title="Update"
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
          description="Remove WTFOS from your device. This will revert all changes apart from the root unlock itself."
          disabled={!hasDinitBinary}
          linkTo="/wtfos/remove"
          title="Remove"
        >
          <DeleteIcon fontSize="large" />
        </Tile>
      </Grid>
    </Grid>
  );
}
