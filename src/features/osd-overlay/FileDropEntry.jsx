import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import {
  Box,
  Card,
  Typography,
  Stack,
} from "@mui/material";

import {
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";

export default function FileDropEntry(props) {
  const { t } = useTranslation("osdOverlay");

  const {
    file,
    icon: Icon,
    label,
  } = props;

  return (
    <Card
      elevation={1}
    >
      <Stack
        spacing={1}
        sx={{ p: 1 }}
      >
        <Stack
          alignItems="center"
          direction="row"
          spacing={0.5}
        >
          <Icon />

          <Typography
            variant="body1"
          >
            {label}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {file && (
            <CheckIcon color="success" />
          )}

          {!file && (
            <ErrorIcon color="error" />
          )}
        </Stack>

        <Typography
          variant="body2"
        >
          {file ? file.name : t("fileDropEntryNoSelection")}
        </Typography>
      </Stack>
    </Card>
  );
}

FileDropEntry.propTypes = {
  file: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  icon: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  label: PropTypes.string.isRequired,
};

FileDropEntry.defaultProps = { file: null };
