import React from "react";

import Grid from "@mui/material/Grid";

import CoffeeIcon from "@mui/icons-material/Coffee";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";

import Tile from "../tile/Tile";

import SvgIcon from "@mui/material/SvgIcon";
import { ReactComponent as EthereumSvg } from "../../assets/icons/ethereum.svg";

export default function Support() {

  
  return(
    <Grid
      alignItems="stretch"
      container
      spacing={2}
      textAlign="center"

    >

      <Grid
        item
        xs={4}
      >
        <Tile
          description="buymeacoffee.com/fpv.wtf"
          href="https://buymeacoffee.com/fpv.wtf"
        >
          <CoffeeIcon fontSize="large" />
        </Tile>
      </Grid>

      <Grid
        item
        xs={4}
      >
        <Tile
          description="0xbAB1fec80922328F27De6E2F1CDBC2F322397637"
          href="ethereum:0xbAB1fec80922328F27De6E2F1CDBC2F322397637"
        >
          <SvgIcon 
            component={EthereumSvg} 
            fontSize="large" 
            inheritViewBox
          />
        </Tile>
      </Grid>

      <Grid
        item
        xs={4}
      >
        <Tile
          description="3L7dE5EHtyd2b1tXBwdnWC2MADkV2VTbrq"
          href="bitcoin:3L7dE5EHtyd2b1tXBwdnWC2MADkV2VTbrq"
        >
          <CurrencyBitcoinIcon fontSize="large" />
        </Tile>
      </Grid>

    </Grid>
  );
}
