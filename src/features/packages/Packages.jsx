import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import { useTranslation } from "react-i18next";

import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InfoIcon from "@mui/icons-material/Info";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import ReactGA from "react-ga4";

import ErrorLog from "../log/Error";

import {
  clearError,
  fetchPackages,
  installedFilter,
  installPackage,
  removePackage,
  repo,
  search,
  selectFetched,
  selectFilter,
  selectFiltered,
  selectProcessing,
  selectRepos,
} from "./packagesSlice";

import { selectNiceName } from "../device/deviceSlice";

import { selectHasOpkgBinary } from "../device/deviceSlice";

import SetupHint from "../setup/SetupHint";
import Spinner from "../loading/Spinner";

export default function Packages({ adb }) {
  const { t } = useTranslation("packages");
  const tableEl = useRef();
  const scrollListenerId = useRef();

  const dispatch = useDispatch();

  const fetched = useSelector(selectFetched);
  const filter = useSelector(selectFilter);
  const filtered = useSelector(selectFiltered);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const processing = useSelector(selectProcessing);
  const repos = useSelector(selectRepos);

  const deviceName = useSelector(selectNiceName);

  const [installed, setInstalled] = useState(filter.installed);

  const step = 50;
  const [renderOffset, setRenderOffset] = useState(50);
  const [renderRows, setRenderRows] = useState(filtered.slice(0, step));
  const [loading, setLoading] = useState(false);

  const handleInstallStateChange = useCallback((event) => {
    const installed = event.target.value === "installed";

    dispatch(installedFilter(installed));
    setInstalled(installed);
  }, [dispatch]);

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    if(value.length > 1) {
      dispatch(search(value));
    } else {
      dispatch(search(""));
    }
  }, [dispatch]);

  const handleRepoChange = useCallback((event) => {
    const value = event.target.value;
    dispatch(repo(value));
  }, [dispatch]);

  useEffect(() => {
    if(!fetched) {
      dispatch(fetchPackages(adb));
    }
  }, [adb, dispatch, fetched]);

  useEffect(() => {
    setRenderRows(filtered.slice(0, step));
    setRenderOffset(step);
  }, [filtered]);

  const scrollListener = useCallback(() => {
    let bottom = window.pageYOffset;
    let innerHeight = window.innerHeight;
    let totalHeight = document.body.offsetHeight;
    let maxHeight = totalHeight - innerHeight;
    let currentHeight = maxHeight - bottom;
    if(currentHeight < 250 && !loading) {
      if(renderOffset < filtered.length) {
        setLoading(true);
        const offset = renderOffset + step;
        setRenderRows(filtered.slice(0, offset));
        setRenderOffset(offset);
        setLoading(false);
      }
    }
  }, [filtered, loading, renderOffset]);

  useEffect(() => {
    window.removeEventListener("scroll", scrollListenerId.current);
    scrollListenerId.current = scrollListener;
    window.addEventListener("scroll", scrollListener);
  }, [scrollListener]);

  const removeHandler = useCallback((event) => {
    const name = event.target.dataset["key"];
    ReactGA.gtag("event", "removePackage", {
      name,
      deviceName,
    });

    dispatch(removePackage({
      adb,
      name,
    }));
  }, [adb, deviceName, dispatch]);

  const installHandler = useCallback((event) => {
    const name = event.target.dataset["key"];
    ReactGA.gtag("event", "installPackage", {
      name,
      deviceName,
    });

    dispatch(installPackage({
      adb,
      name,
    }));
  }, [adb, deviceName, dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const rows = renderRows.map((item) => {
    console.log(item.details.homepage);
    return (
      <TableRow key={item.name}>
        <TableCell sx={{ width: 250 }}>
          {item.name}
        </TableCell>

        <TableCell sx={{
          maxWidth: 100,
          wordWrap: "break-word",
        }}
        >
          {item.version}
        </TableCell>

        <TableCell>
          {item.description}
        </TableCell>

        <TableCell>
          {item.details.homepage &&
            <Link
              href={item.details.homepage}
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
                  data-key={item.name}
                  sx={{ fontSize: 40 }}
                />
              </IconButton>
            </Link>}
        </TableCell>

        <TableCell
          sx={{ textAlign: "center" }}
        >
          {item.installed &&
            <IconButton
              aria-label={t("remove")}
              disabled={processing}
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
                data-key={item.name}
              />

              <Typography
                color="success"
                variant="caption"
              >
                {t("remove")}
              </Typography>
            </IconButton>}

          {!item.installed &&
            <IconButton
              aria-label={t("install")}
              disabled={processing}
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
                data-key={item.name}
                disabled={processing}
              />

              <Typography
                color="success"
                variant="caption"
              >
                {t("install")}
              </Typography>
            </IconButton>}
        </TableCell>
      </TableRow>
    );
  });

  const renderedRepos = repos.map((repo) => {
    return(
      <MenuItem
        key={repo}
        value={repo}
      >
        {repo}
      </MenuItem>
    );
  });

  const packageString = t("matchCount", { count: filtered.length } );
  return (
    <>
      {!hasOpkgBinary &&
        <SetupHint />}

      {!fetched && hasOpkgBinary &&
        <Spinner text={t("fetching")} />}

      {fetched && hasOpkgBinary &&
        <Stack
          spacing={2}
        >
          <ErrorLog title={t("installationFailed")} />

          <Box
            component="form"
            noValidate
            sx={{ "& > :not(style)": { m: 1 } }}
          >
            <FormControl sx={{ width: 120 }}>
              <InputLabel id="package-state-select-label">
                {t("labelRepo")}
              </InputLabel>

              <Select
                disabled={filter.search}
                id="package-state-select"
                label={t("labelPackages")}
                onChange={handleRepoChange}
                value={filter.repo}
              >
                <MenuItem value="all">
                  {t("labelAll")}
                </MenuItem>

                {renderedRepos}
              </Select>
            </FormControl>

            <FormControl sx={{ width: 120 }}>
              <InputLabel id="package-state-select-label">
                {t("labelPackages")}
              </InputLabel>

              <Select
                id="package-state-select"
                label={t("labelPackages")}
                onChange={handleInstallStateChange}
                value={installed ? "installed" : "all"}
              >
                <MenuItem value="all">
                  {t("labelAll")}
                </MenuItem>

                <MenuItem value="installed">
                  {t("installed")}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ width: 250 }}>
              <TextField
                defaultValue={filter.search}
                id="outlined-basic"
                label={t("labelSearch")}
                onChange={handleSearchChange}
                variant="outlined"
              />
            </FormControl>
          </Box>

          <Typography>
            {packageString}
          </Typography>

          <TableContainer
            component={Paper}
            ref={tableEl}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t("name")}
                  </TableCell>

                  <TableCell>
                    {t("version")}
                  </TableCell>

                  <TableCell>
                    {t("description")}
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
        </Stack>}
    </>
  );
}

Packages.propTypes = { adb: PropTypes.shape().isRequired };
