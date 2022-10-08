import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import validator from "@rjsf/validator-ajv6";
import Form from "@rjsf/mui";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  fetchPackage,
  fetchConfig,
  reset,
  selectConfig,
  selectDescription,
  selectError,
  selectFetched,
  selectInstalled,
  selectLoading,
  selectName,
  selectSchema,
  selectWriting,
  writeConfig,
} from "./packageSlice";

import { selectPassed } from "../healthcheck/healthcheckSlice";
import Spinner from "../loading/Spinner";

export default function Package({ adb }) {
  const { t } = useTranslation("package");
  const dispatch = useDispatch();

  let { packageSlug } = useParams();

  const healthchecksPassed = useSelector(selectPassed);

  const packageName = useSelector(selectName);
  const description = useSelector(selectDescription);
  const installed = useSelector(selectInstalled);

  const fetched = useSelector(selectFetched);
  const config = useSelector(selectConfig);
  const schema = useSelector(selectSchema);

  const loading = useSelector(selectLoading);
  const writing = useSelector(selectWriting);
  const error = useSelector(selectError);

  /**
   * Fetch package details if healthchecks passed and dtails are not yet
   * set for the selected package.
   */
  useEffect(() => {
    if (!fetched && healthchecksPassed) {
      dispatch(fetchPackage({
        adb,
        name: packageSlug,
      }));
    }
  }, [adb, dispatch, fetched, healthchecksPassed, packageSlug]);

  useEffect(() => {
    if(packageName !== packageSlug) {
      dispatch(reset());
    }
  }, [dispatch, packageName, packageSlug]);

  // Fetch config and schema if package is installed
  useEffect(() => {
    if(installed) {
      dispatch(fetchConfig(adb));
    }
  }, [adb, dispatch, installed]);

  const saveConfig = useCallback(({ formData }) => {
    dispatch(writeConfig({
      adb,
      config: formData,
    }));
  }, [adb, dispatch]);

  return (
    <Paper>
      <Box p={2}>
        <Stack spacing={2}>
          <Typography variant="h4">
            {t("detailsFor", { name: packageSlug })}
          </Typography>

          {loading &&
            <Spinner text={t("loading")} />}

          <Typography variant="body1">
            {description}
          </Typography>

          {schema &&
            <Form
              formData={config}
              onSubmit={saveConfig}
              schema={JSON.parse(JSON.stringify(schema))}
              validator={validator}
            >
              <Button
                disabled={writing}
                type="submit"
                variant="contained"
              >
                {t("submit")}
              </Button>
            </Form>}

          {error &&
            <Alert severity="error">
              {error}
            </Alert>}
        </Stack>
      </Box>
    </Paper>
  );
}

Package.propTypes = { adb: PropTypes.shape().isRequired };
