import PropTypes from "prop-types";
import React from "react";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function Spinner({ text }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ display: "flex" }}
    >
      <Box
        justifyContent="center"
        sx={{ display: "flex" }}
      >
        <CircularProgress />
      </Box>

      <Typography>
        {text}
      </Typography>
    </Stack>
  );
}

Spinner.propTypes = { text: PropTypes.string.isRequired };
