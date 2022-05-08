import PropTypes from "prop-types";
import React, { useCallback }  from "react";
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
  selectHasOpkgBinary,
  selectLog,
  selectStatus,
} from "../device/deviceSlice";

import {
  processing,
  selectProcessing,
} from "../packages/packagesSlice";

export default function Install({ adb }) {
  const dispatch = useDispatch();

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const log = useSelector(selectLog);
  const isProcessing = useSelector(selectProcessing);

  const onClick = useCallback(async (device) => {
    dispatch(clearLog());
    dispatch(processing(true));

    await adb.installWTFOS((message) => {
      dispatch(appendToLog(message));
    });

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
        disabled={hasOpkgBinary || isProcessing}
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

Install.propTypes = { adb: PropTypes.shape().isRequired };
