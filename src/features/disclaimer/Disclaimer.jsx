import PropTypes from "prop-types";
import React from "react";

import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

export default function Disclaimer({
  lines,
  title,
}) {
  const renderedLines = lines.map((line) => {
    return(
      <ListItem
        dense
        key={line}
      >
        <Typography>
          {line}
        </Typography>
      </ListItem>
    );
  });

  return(
    <Alert severity="warning">
      <Typography sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>

      <List>
        {renderedLines}
      </List>
    </Alert>
  );
}

Disclaimer.propTypes = {
  lines: PropTypes.arrayOf(PropTypes.string).isRequired,
  title: PropTypes.string.isRequired,
};
