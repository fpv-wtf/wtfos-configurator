import PropTypes from "prop-types";
import React from "react";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function UpdatesBanner({ updatePluralized }) {
  const { t } = useTranslation("packages");
  const navigate = useNavigate();

  const navigateUpdate = useCallback(() => {
    navigate("/wtfos/update");
  }, [navigate]);

  return (
    <Stack
      marginBottom={2}
      spacing={2}
      sx={{ width: "100%" }}
    >

      <Alert severity="info">
        <Typography>
          {updatePluralized ? t("updatesAvailable") : t("updateAvailable")}
        </Typography>
      </Alert>

      <Button
        onClick={navigateUpdate}
        variant="contained"
      >
        {t("update")}
      </Button>

    </Stack>
  );
}

UpdatesBanner.propTypes = { updatePluralized: PropTypes.bool.isRequired };

