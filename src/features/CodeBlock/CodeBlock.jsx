import PropTypes from "prop-types";
import React from "react";

import Typography from "@mui/material/Typography";

export default function CodeBlock({ content }) {
  return(
    <Typography
      component="pre"
      sx={{
        whiteSpace: "normal",
        fontFamily: "Monospace",
        marginTop: "10px",
        marginBottom: "10px",
      }}
      variant="caption"
    >
      { `${content}` }
    </Typography>
  );
}

CodeBlock.propTypes = { content: PropTypes.string.isRequired };
