import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
}  from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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

import {
  fetchPackages,
  installedFilter,
  installPackage,
  removePackage,
  search,
  selectFetched,
  selectFilter,
  selectFiltered,
  selectProcessing,
} from "./packagesSlice";

import { selectHasOpkgBinary } from "../device/deviceSlice";

import SetupHint from "../setup/SetupHint";

export default function Packages({ adb }) {
  const tableEl = useRef();

  const dispatch = useDispatch();

  const fetched = useSelector(selectFetched);
  const filter = useSelector(selectFilter);
  const filtered = useSelector(selectFiltered);
  const hasOpkgBinary = useSelector(selectHasOpkgBinary);
  const processing = useSelector(selectProcessing);

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
    window.removeEventListener("scroll", scrollListener);
    window.addEventListener("scroll", scrollListener);
  }, [scrollListener]);

  const removeHandler = useCallback((event) => {
    const name = event.target.dataset["key"];
    dispatch(removePackage({
      adb,
      name,
    }));
  }, [adb, dispatch]);

  const installHandler = useCallback((event) => {
    const name = event.target.dataset["key"];
    dispatch(installPackage({
      adb,
      name,
    }));
  }, [adb, dispatch]);

  const rows = renderRows.map((item) => {
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

        <TableCell align="right">
          {item.installed &&
            <Button
              color="error"
              data-key={item.name}
              disabled={processing}
              onClick={removeHandler}
              variant="contained"
            >
              Remove
            </Button>}

          {!item.installed &&
            <Button
              color="success"
              data-key={item.name}
              disabled={processing}
              onClick={installHandler}
              variant="contained"
            >
              Install
            </Button>}
        </TableCell>
      </TableRow>
    );
  });

  const packageString = `Found ${filtered.length} packages`;
  return (
    <>
      {!hasOpkgBinary &&
        <SetupHint />}

      {!fetched && hasOpkgBinary &&
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={2}
          sx={{ display: "flex" }}
        >
          <Box
            justifyContent="center"
            sx={{ display: "flex" }}
          >
            <CircularProgress />
          </Box>

          <Typography>
            Fetching packages...
          </Typography>
        </Stack>}

      {fetched && hasOpkgBinary &&
        <Stack
          spacing={2}
        >
          <Box
            component="form"
            noValidate
            sx={{ "& > :not(style)": { m: 1 } }}
          >
            <FormControl sx={{ width: 120 }}>
              <InputLabel id="package-state-select-label">
                Packages
              </InputLabel>

              <Select
                id="package-state-select"
                label="Packages"
                onChange={handleInstallStateChange}
                value={installed ? "installed" : "all"}
              >
                <MenuItem value="all">
                  All
                </MenuItem>

                <MenuItem value="installed">
                  Installed
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ width: 250 }}>
              <TextField
                defaultValue={filter.search}
                id="outlined-basic"
                label="Search..."
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
                    Name
                  </TableCell>

                  <TableCell>
                    Version
                  </TableCell>

                  <TableCell>
                    Description
                  </TableCell>

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
