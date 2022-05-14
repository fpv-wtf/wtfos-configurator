import React from "react";
import { useSelector } from "react-redux";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { selectLog } from "../device/deviceSlice";

export default function Log() {
  const log = useSelector(selectLog);

  if(log.length === 0) {
    return null;
  }

  const renderedLog = log.map((line, index) => {
    const key = `${line}-${index}`;

    return (
      <ListItem
        dense
        key={key}
      >
        <Typography
          sx={{ fontFamily: "Monospace" }}
        >
          {line}
        </Typography>
      </ListItem>
    );
  });

  return (
    <Paper>
      <List>
        {renderedLog}
      </List>
    </Paper>
  );
}
