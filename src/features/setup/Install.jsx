import PropTypes from "prop-types";
import React from "react";
import { useSelector } from "react-redux";

import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  selectHasOpkgBinary,
  selectLog,
  selectStatus,
} from "../device/deviceSlice";

export default function Install({ onClick }) {
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const log = useSelector(selectLog);
  const status = useSelector(selectStatus);

  const renderedLog = log.map((line) => {
    return (
      <ListItem key={line}>
        <Typography
          sx={{ fontFamily: "Monospace" }}
        >
          {line}
        </Typography>
      </ListItem>
    );
  });

  return(
    <Stack spacing={2}>

      <Button
        disabled={status === "installing" || hasOpkgBinary}
        onClick={onClick}
        variant="contained"
      >
        Install WTFOS
      </Button>

      {log.length > 0 &&
        <Paper>
          <List>
            {renderedLog}
          </List>
        </Paper>}

    </Stack>
  );
}

Install.propTypes = { onClick: PropTypes.func.isRequired };
