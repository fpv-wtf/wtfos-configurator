import PropTypes from "prop-types";
import React, {
  useEffect,
  useCallback,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import Disclaimer from "../disclaimer/Disclaimer";
import Spinner from "../loading/Spinner";

import {
  installHealthchecks,
  runHealthcheckFix,
  runHealthcheckUnits,
  selectChecks,
  selectFailed,
  selectProcessing,
} from "./healthcheckSlice";

export default function Healthcheck({
  adb,
  appendToLog,
  clearLog,
}) {
  const { t } = useTranslation("healthcheck");
  const dispatch = useDispatch();

  const checks = useSelector(selectChecks);
  const checksFailed = useSelector(selectFailed);
  const isProcessing = useSelector(selectProcessing);

  const log = (message) => {
    if(appendToLog) {
      dispatch(appendToLog(message));
    } else {
      console.log(message);
    }
  };

  const dispatchRunHealthcheckUnits = () => {
    dispatch(runHealthcheckUnits({
      adb,
      log,
    }));
  };

  const handleFix = useCallback(async (event) => {
    const path = event.target.dataset["path"];
    dispatch(runHealthcheckFix({
      adb,
      path,
      log,
      done: dispatchRunHealthcheckUnits,
    }));
  }, [adb, appendToLog, dispatch]);

  useEffect(() => {
    if(clearLog) {
      dispatch(clearLog());
    }

    dispatch(installHealthchecks({
      adb,
      log,
      done: dispatchRunHealthcheckUnits,
    }));
  }, [adb, appendToLog, clearLog, dispatch]);

  let HealthcheckTable = null;
  const failed = checks.filter((item) => !item.passed);
  if(failed.length > 0) {
    const rows = failed.map((item, index) => {
      return (
        <TableRow key={item.id}>
          <TableCell dangerouslySetInnerHTML={{ __html: item.output.join("<br />") }} />

          <TableCell sx={{ textAlign: "right" }}>
            {!item.passed && item.fixable &&
              <Button
                data-path={item.path}
                disabled={index !== 0 || isProcessing}
                onClick={handleFix}
                variant="contained"
              >
                {t("fix")}
              </Button>}
          </TableCell>
        </TableRow>
      );
    });

    HealthcheckTable = (
      <TableContainer
        component={Paper}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell colSpan={2}>
                <Alert severity="warning">
                  <Typography sx={{ fontWeight: "bold" }}>
                    {t("message")}
                  </Typography>

                  <Typography>
                    {t("warningDescription")}
                  </Typography>
                </Alert>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if(checksFailed) {
    return (
      <Stack marginBottom={2}>
        <Alert severity="warning">
          <Typography>
            {t("failed")}
          </Typography>
        </Alert>
      </Stack>
    );
  }

  if(failed.length < 1) {
    return null;
  }

  return(
    <Box
      sx={{ position: "relative" }}
    >
      <Stack
        marginBottom={2}
        spacing={2}
      >
        {HealthcheckTable}
      </Stack>

      {isProcessing &&
        <Box
          sx={{
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0, 0, 0, 0.7)",
          }}
        >
          <Spinner
            text={t("loading")}
          />
        </Box>}
    </Box>
  );
}

Healthcheck.defaultProps = {
  appendToLog: null,
  clearLog: null,
};

Healthcheck.propTypes = {
  adb: PropTypes.shape().isRequired,
  appendToLog: PropTypes.func,
  clearLog: PropTypes.func,
};
