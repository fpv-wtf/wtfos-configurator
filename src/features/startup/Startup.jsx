import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
}  from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";

import SetupHint from "../setup/SetupHint";

import {
  disableService,
  enableService,
  fetchServices,
  selectError,
  selectFetched,
  selectProcessing,
  selectServices,
} from "./startupSlice";

import { selectHasDinitBinary } from "../device/deviceSlice";

export default function Startup({ adb }) {
  const { t } = useTranslation("startup");
  const dispatch = useDispatch();

  const error = useSelector(selectError);
  const fetched = useSelector(selectFetched);
  const hasDinitBinary = useSelector(selectHasDinitBinary);
  const services = useSelector(selectServices);
  const processing = useSelector(selectProcessing);

  useEffect(() => {
    if(!fetched) {
      dispatch(fetchServices(adb));
    }
  }, [adb, dispatch, fetched]);

  const handleChange = useCallback((event) => {
    const checked = event.target.checked;
    const name = event.target.dataset["name"];
    if(checked) {
      dispatch(enableService({
        adb,
        name,
      }));
    } else {
      dispatch(disableService({
        adb,
        name,
      }));
    }
  }, [adb, dispatch]);

  const renderedServices = services.map((item) => {
    return(
      <TableRow
        key={item.name}
      >
        <TableCell>
          <FormControlLabel
            control={
              <Switch
                checked={item.enabled}
                inputProps={{ "data-name": item.name }}
                onChange={handleChange}
              />
            }
            data-name={item.name}
            disabled={processing}
            label={item.name}
          />
        </TableCell>

        <TableCell align="right">
          {item.enabled && item.info.status === "running" && item.info.pid &&
            <Chip
              color="success"
              label={t("running", { values: { pid: item.info.pid } })}
            />}

          {item.enabled && item.info.status === "started" && !item.info.pid &&
            <Chip
              color="success"
              label={t("started")}
            />}

          {item.enabled && item.info.status === "stopped" && !item.info.pid &&
            <Chip
              color="error"
              label={t("stopped")}
            />}
        </TableCell>
      </TableRow>
    );
  });

  return (
    <Stack spacing={2}>
      {!hasDinitBinary &&
        <SetupHint />}

      {error && hasDinitBinary &&
        <Alert severity="error">
          {error}
        </Alert>}

      {hasDinitBinary &&
        <Paper>
          <Box p={2}>

            <Typography>
              {t("hint")}
            </Typography>

            <Table>
              <TableBody>
                {renderedServices}
              </TableBody>
            </Table>
          </Box>
        </Paper>}
    </Stack>
  );
}

Startup.propTypes = { adb: PropTypes.shape().isRequired };
