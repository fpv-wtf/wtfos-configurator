import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useState,
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
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import {
  fetchPackage,
  fetchConfig,
  reset,
  selectConfig,
  selectDescription,
  selectDetails,
  selectError,
  selectFetched,
  selectInstalled,
  selectInstalledVersion,
  selectLoading,
  selectName,
  selectSchema,
  selectWriting,
  writeConfig,
} from "./packageSlice";

import {
  installPackage,
  removePackage,
  selectError as selectInstallationError,
  selectProcessing,
} from "../packages/packagesSlice";

import { selectPassed } from "../healthcheck/healthcheckSlice";
import Spinner from "../overlays/Spinner";

export default function Package({ adb }) {
  const { t } = useTranslation("package");
  const dispatch = useDispatch();

  let { packageSlug } = useParams();

  const healthchecksPassed = useSelector(selectPassed);

  const packageName = useSelector(selectName);
  const description = useSelector(selectDescription);
  const installed = useSelector(selectInstalled);
  const installedVersion = useSelector(selectInstalledVersion);
  const details = useSelector(selectDetails);

  const fetched = useSelector(selectFetched);
  const config = useSelector(selectConfig);
  const schema = useSelector(selectSchema);

  const loading = useSelector(selectLoading);
  const writing = useSelector(selectWriting);
  const error = useSelector(selectError);

  const isProcessing = useSelector(selectProcessing);
  const installationError = useSelector(selectInstallationError);

  const [installing, setInstalling] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  useEffect(() => {
    setCurrentConfig(config);
  }, [config]);

  /**
   * Fetch package details if healthchecks passed and details are not yet
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

  useEffect(() => {
    if(!isProcessing) {
      setInstalling(false);
      setRemoving(false);

      dispatch(fetchPackage({
        adb,
        name: packageSlug,
      }));
    }
  }, [adb, dispatch, isProcessing, packageSlug, setInstalling, setRemoving]);

  // Fetch config and schema if package is installed
  useEffect(() => {
    if(installed) {
      dispatch(fetchConfig(adb));
    }
  }, [adb, dispatch, installed]);

  const saveConfig = useCallback(({ formData }) => {
    setCurrentConfig(formData);
    dispatch(writeConfig({
      adb,
      config: formData,
      units: schema.units,
    }));
  }, [adb, dispatch, schema, setCurrentConfig]);

  const removeHandler = useCallback(() => {
    setRemoving(true);
    dispatch(removePackage({
      adb,
      name: packageName,
    }));
  }, [adb, dispatch, packageName, setRemoving]);

  const installHandler = useCallback(() => {
    setInstalling(true);
    dispatch(installPackage({
      adb,
      name: packageName,
    }));
  }, [adb, dispatch, packageName, setInstalling]);

  let loadingText = t("loading");
  if(installing) {
    loadingText = t("installing");
  } else if(removing) {
    loadingText = t("removing");
  }

  const isLoading = loading || installing || removing;
  const errorText = installationError.map((line) => {
    return (
      <Typography key={line}>
        {line}
      </Typography>
    );
  });

  const versionText = installed ? ` ${installedVersion}` : "";

  return (
    <>
      {installationError.length > 0 &&
        <Alert
          severity="error"
          sx={{ marginBottom: 2 }}
        >
          {errorText}
        </Alert>}

      <Paper sx={{ position: "relative" }} >
        <Box p={2}>
          <Stack spacing={2}>
            <Grid
              alignItems="stretch"
              container
            >
              <Grid
                item
                md={9}
              >
                <Typography variant="h4">
                  {t("detailsFor", { name: packageSlug })}

                  {versionText}
                </Typography>

                {details.maintainer &&
                  <Typography variant="body2">
                    {t("maintainer", { name: details.maintainer })}
                  </Typography>}
              </Grid>

              <Grid
                item
                md={3}
                sx={{
                  display: "flex",
                  justifyContent: "right",
                  alignItems: "center",
                }}
              >
                <Box>
                  {details.homepage &&
                    <Link
                      href={details.homepage}
                      sx={{
                        whiteSpace: "nowrap",
                        textDecoration: "none",
                      }}
                      target="_blank"
                    >
                      <IconButton
                        aria-label={t("visitProjectPage")}
                        sx={{
                          width: 65,
                          height: 65,
                        }}
                        title={t("visitProjectPage")}
                      >
                        <InfoIcon
                          color="success"
                          data-key={packageName}
                          sx={{ fontSize: 40 }}
                        />
                      </IconButton>
                    </Link>}
                </Box>

                {fetched &&
                  <Box>
                    {installed &&
                      <IconButton
                        aria-label={t("remove")}
                        onClick={removeHandler}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          width: 65,
                          height: 65,
                        }}
                        title={t("remove")}
                      >
                        <DeleteIcon
                          color="error"
                          data-key={packageName}
                        />

                        <Typography
                          color="success"
                          variant="caption"
                        >
                          {t("remove")}
                        </Typography>
                      </IconButton>}

                    {!installed &&
                      <IconButton
                        aria-label={t("install")}
                        onClick={installHandler}
                        sx={{
                          display: "inline-flex",
                          flexDirection: "column",
                          width: 65,
                          height: 65,
                        }}
                        title={t("install")}
                      >
                        <DownloadIcon
                          color="success"
                          data-key={packageName}
                        />

                        <Typography
                          color="success"
                          variant="caption"
                        >
                          {t("install")}
                        </Typography>
                      </IconButton>}
                  </Box>}
              </Grid>
            </Grid>

            <Typography variant="body1">
              {description}
            </Typography>

            {schema && installed &&
              <Form
                formData={currentConfig}
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

        {isLoading &&
          <Spinner text={loadingText} />}
      </Paper>
    </>
  );
}

Package.propTypes = { adb: PropTypes.shape().isRequired };
