import React from "react";
import PropTypes from "prop-types";
import {
  Trans, useTranslation,
} from "react-i18next";

import {
  FormGroup,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Paper,
  Typography,
  Stack,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";

export default function Config(props) {
  const {
    config,
    onChange,
  } = props;

  const { t } = useTranslation("osdOverlay");

  const onChromaKeyChange = React.useCallback((event) => {
    onChange({
      ...config,
      chromaKey: event.target.checked,
    });
  }, [config, onChange]);

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
            control={<Checkbox checked={config.chromaKey}  />}
            label={t("configChromaKey")}
            onChange={onChromaKeyChange}
          />

          <FormHelperText>
            <Trans i18nKey="osdOverlay:configChromaKeyHelp">
              <span style={{ color: "#FF00FF" }} />
            </Trans>
          </FormHelperText>
        </FormGroup>
      </Stack>
    </Paper>
  );
}

Config.propTypes = {
  config: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  onChange: PropTypes.func.isRequired,
};
