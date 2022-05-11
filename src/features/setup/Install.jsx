import PropTypes from "prop-types";
import React, {
  useEffect,
  useCallback,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import Log from "../log/Log";

import {
  appendToLog,
  checkBinaries,
  clearLog,
  rebooting,
  selectHasOpkgBinary,
} from "../device/deviceSlice";

import {
  installWTFOS,
  selectProcessing,
} from "../packages/packagesSlice";

export default function Install({ adb }) {
  const dispatch = useDispatch();

  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const isProcessing = useSelector(selectProcessing);

  const onClick = useCallback(async (device) => {
    dispatch(clearLog());
    dispatch(installWTFOS({
      adb,
      callback: (message) => {
        dispatch(appendToLog(message));
      },
      setRebooting: () => {
        dispatch(rebooting(true));
      },
    }));
  }, [adb, dispatch]);

  useEffect(() => {
    dispatch(checkBinaries(adb));
  }, [adb, dispatch, isProcessing]);

  return(
    <Stack spacing={2}>
      <Button
        disabled={hasOpkgBinary || isProcessing}
        onClick={onClick}
        variant="contained"
      >
        Install WTFOS
      </Button>

      <Log />
    </Stack>
  );
}

Install.propTypes = { adb: PropTypes.shape().isRequired };
