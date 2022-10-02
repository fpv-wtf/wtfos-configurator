import React from "react";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function Claimed() {
  const { t } = useTranslation("claimed");

  return(
    <Box
      sx={{
        background: "rgba(0, 0, 0, 0.85)",
        position: "fixed",
        left: "0px",
        top: "0px",
        width: "100%",
        height: "100%",
        zIndex: "100",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Paper
        sx={{ padding: 2 }}
      >
        <Typography spacing={2}>
          {t("claimed")}
        </Typography>
      </Paper>
    </Box>
  );
}

Claimed.propTypes = {};
