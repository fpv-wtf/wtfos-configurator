
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

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import {
  installHealthchecks,
  selectChecks,
  selectPassed,
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
  const healthchecksPassed = useSelector(selectPassed);

  const handleFix = useCallback(async (event) => {
    const path = event.target.dataset["path"];
    console.log('Handle fix', path);
  });

  const handleInstall = useCallback(async (device) => {
    dispatch(clearLog());
    dispatch(installHealthchecks({
      adb,
      callback: (message) => {
        dispatch(appendToLog(message));
      },
    }));
  }, [adb, dispatch]);

  let HealthcheckTable = null;
  if(checks.length > 0) {
    const rows = checks.map((item) => {
      console.log(item);
      return (
        <TableRow key={item.id}>
          <TableCell sx={{
            maxWidth: 100,
            wordWrap: "break-word",
          }}
          >
            {item.id}
          </TableCell>

          <TableCell>
            {item.name}
          </TableCell>

          <TableCell dangerouslySetInnerHTML={{ __html: item.output.join("<br />") }} />

          <TableCell>
            {!item.passed && item.fixable &&
              <Button
                data-path={item.path}
                onClick={handleFix}
                variant="contained"
              >
                {t("fix")}
              </Button>}
          </TableCell>

          <TableCell sx={{ textAlign: "center" }}>
            {item.passed &&
              <CheckCircleIcon
                color="success"
              />}

            {!item.passed &&
              <CancelIcon
                color="error"
              />}
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
                {t("testNr")}
              </TableCell>

              <TableCell>
                {t("testName")}
              </TableCell>

              <TableCell>
                {t("message")}
              </TableCell>

              <TableCell />

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

  return(
    <Stack spacing={2}>
      {HealthcheckTable}

      <Button
        disabled={isProcessing || healthchecksPassed}
        onClick={handleInstall}
        variant="contained"
      >
        {t("runHealthchecks")}
      </Button>
    </Stack>
  );
}

Healthcheck.propTypes = {
  adb: PropTypes.shape().isRequired,
  appendToLog: PropTypes.func.isRequired,
  clearLog: PropTypes.func.isRequired,
};
