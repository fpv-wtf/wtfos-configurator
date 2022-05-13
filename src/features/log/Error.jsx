import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

import Alert from "@mui/material/Alert";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";

import { selectError } from "../packages/packagesSlice";

export default function ErrorLog({ title }) {
  const log = useSelector(selectError);

  if(log.length === 0) {
    return null;
  }

  const renderedLog = log.map((line, index) => {
    const key = `${line}-${index}`;

    return (
      <ListItem key={key}>
        <Typography
          sx={{ fontFamily: "Monospace" }}
        >
          {line}
        </Typography>
      </ListItem>
    );
  });

  return (
    <Alert severity="error">
      {title}

      <List>
        {renderedLog}
      </List>
    </Alert>
  );
}

ErrorLog.propTypes = { title: PropTypes.string.isRequired };
