import React from "react";
import PropTypes from "prop-types";
import {
  Trans, useTranslation,
} from "react-i18next";

import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";

export default function Config(props) {
  const {
    chromaKey,
    chromaKeyColor,
    onChange,
  } = props;

  const { t } = useTranslation("osdOverlay");

  const onChromaKeyChange = React.useCallback((event) => {
    onChange({ chromaKey: event.target.checked });
  }, [onChange]);

  const onChromaKeyColorChange = React.useCallback((event) => {
    onChange({ chromaKeyColor: event.target.value });
  }, [onChange]);

  const chromaKeyColorPicker = React.useMemo(() => {
    if (!chromaKey) {
      return null;
    }

    const isError = !/^#[0-9A-F]{6}$/i.test(chromaKeyColor);

    return (
      <FormGroup sx={{ mt: 2 }}>
        <TextField
          error={isError}
          label={t("configChromaKeyColor")}
          onChange={onChromaKeyColorChange}
          value={chromaKeyColor}
        />
      </FormGroup>
    );
  }, [chromaKey, chromaKeyColor, onChromaKeyColorChange, t]);

  return (
    <Paper
      elevation={0}
      sx={{
        pl: 2,
        pr: 2,
      }}
    >
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="center"
        spacing={0.5}
        sx={{ mt: 2 }}
      >
        <SettingsIcon />

        <Typography variant="body1">
          {t("configTitle")}
        </Typography>
      </Stack>

      <Stack
        sx={{ mb: 2 }}
      >
        <FormGroup>
          <FormControlLabel
            control={<Checkbox checked={chromaKey}  />}
            label={t("configChromaKey")}
            onChange={onChromaKeyChange}
          />

          <FormHelperText>
            <Trans i18nKey="osdOverlay:configChromaKeyHelp">
              <span style={{ color: chromaKeyColor }} />
            </Trans>
          </FormHelperText>
        </FormGroup>

        {chromaKeyColorPicker}
      </Stack>
    </Paper>
  );
}

Config.propTypes = {
  chromaKey: PropTypes.bool.isRequired,
  chromaKeyColor: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
