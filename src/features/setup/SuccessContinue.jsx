import PropTypes from "prop-types";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export default function SuccessContinue({ message }) {
  const { t } = useTranslation("setup");
  const navigate = useNavigate();

  return (
    <Stack spacing={2}>
      <Alert severity="success">
        {message}
      </Alert>

      <Button
        onClick={() => navigate("/")}
        variant="contained"
      >
        {t("continue")}
      </Button>
    </Stack>
  );
}

SuccessContinue.propTypes = { message: PropTypes.string.isRequired };
