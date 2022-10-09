import PropTypes from "prop-types";
import React from "react";

import Box from "@mui/material/Box";

import Spinner from "../loading/Spinner";

export default function SpinnerOverlay({ text }) {
  return(
    <Box
      sx={{
        background: "rgba(0, 0, 0, 0.75)",
        position: "absolute",
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
      <Spinner text={text} />
    </Box>
  );
}

SpinnerOverlay.defaultProps = { text: "" };

SpinnerOverlay.propTypes = { text: PropTypes.string };
