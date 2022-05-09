import PropTypes from "prop-types";
import React, { useCallback } from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  appendToLog,
  checkBinaries,
  clearLog,
  rebooting,
  selectHasOpkgBinary,
  selectLog,
} from "../device/deviceSlice";

import {
  processing,
  removeWTFOS,
  selectProcessing,
} from "../packages/packagesSlice";

export default function Remove({ adb }) {
  const dispatch = useDispatch();

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const log = useSelector(selectLog);
  const isProcessing = useSelector(selectProcessing);

  const onClick = useCallback(async (device) => {
    dispatch(clearLog());
    dispatch(removeWTFOS({
      adb,
      callback: (message) => {
        dispatch(appendToLog(message));
      },
      setRebooting: () => {
        dispatch(rebooting(true));
      },
    }));

    dispatch(processing(false));
    dispatch(checkBinaries(adb));
  }, [adb, dispatch]);

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
        disabled={!hasOpkgBinary || isProcessing}
        onClick={onClick}
        variant="contained"
      >
        Remove WTFOS
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

Remove.propTypes = { adb: PropTypes.shape().isRequired };
