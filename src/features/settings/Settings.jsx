import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useSelector, useDispatch,
} from "react-redux";

import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";

import {
  persistDisclaimersStatus, selectDisclaimersStatus,
} from "./settingsSlice";

import Header from "../navigation/Header";

export default function Settings() {
  const { t } = useTranslation("settings");
  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  const dispatch = useDispatch();

  const handleDisclaimerStateChange = useCallback((e) => {
    dispatch(persistDisclaimersStatus(e.target.checked));
  }, [dispatch]);

  return (
    <Container
      fixed
      sx={{ mb: 8 }}
    >
      <Header />

      <Stack >
        <Paper sx={{ paddingX: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={disclaimersStatus}
                onChange={handleDisclaimerStateChange}
              />
            }
            label={t("disclaimersSetting")}
            sx={{ paddingY: 1 }}
          />
        </Paper>
      </Stack>

    </Container>
  );
}
