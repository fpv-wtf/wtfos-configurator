import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useSelector, useDispatch,
} from "react-redux";

import CheckBox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";

import {
  persistDisclaimersStatus, selectDisclaimersStatus,
} from "./settingsSlice";

export default function Settings() {
  const { t } = useTranslation("settings");
  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  const dispatch = useDispatch();

  const handleDisclaimerStateChange = useCallback((e) => {
    dispatch(persistDisclaimersStatus(e.target.checked));
  }, [dispatch]);

  const disclaimersCheckboxString = t("disclaimersCheckbox", { state: !disclaimersStatus ? t("enable") : t("disable") } );

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <CheckBox
            checked={disclaimersStatus}
            onChange={handleDisclaimerStateChange}
          />
        }
        label={disclaimersCheckboxString}
      />
    </FormGroup>
  );
}
