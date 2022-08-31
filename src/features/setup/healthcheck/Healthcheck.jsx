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

import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import Disclaimer from "../../disclaimer/Disclaimer";

import {
  installHealthchecks,
  runHealthcheckFix,
  runHealthcheckUnits,
  selectChecks,
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
  const isProcessing = useSelector(selectProcessing);

  const handleFix = useCallback(async (event) => {
    const path = event.target.dataset["path"];
    dispatch(runHealthcheckFix({
      adb,
      path,
      log: (message) => {
        dispatch(appendToLog(message));
      },
      done: () => {
        dispatch(runHealthcheckUnits({
          adb,
          log: (message) => {
            dispatch(appendToLog(message));
          },
        }));
      },
    }));
  }, [adb, appendToLog, dispatch]);

  useEffect(() => {
    dispatch(clearLog());
    dispatch(installHealthchecks({
      adb,
      log: (message) => {
        dispatch(appendToLog(message));
      },
      done: () => {
        dispatch(runHealthcheckUnits({
          adb,
          log: (message) => {
            dispatch(appendToLog(message));
          },
        }));
      },
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
              <TableCell>
                {t("message")}
              </TableCell>

              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {rows}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  if(failed.length < 1) {
    return null;
  }

  return(
    <Stack spacing={2}>
      <Disclaimer
        lines={[
          t("warningDescription"),
        ]}
        title={t("warningTitle")}
      />

      {HealthcheckTable}
    </Stack>
  );
}

Healthcheck.propTypes = {
  adb: PropTypes.shape().isRequired,
  appendToLog: PropTypes.func.isRequired,
  clearLog: PropTypes.func.isRequired,
};
