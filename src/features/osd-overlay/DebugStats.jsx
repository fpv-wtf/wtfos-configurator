/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-unused-prop-types */

import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Typography,
} from "@mui/material";

import SettingsIcon from "@mui/icons-material/Settings";

export default function DebugStats(props) {
  const { t } = useTranslation("osdOverlay");

  const statsTableDef = [
    {
      key: "expectedFrames",
      name: t("debugStatsExpectedFrames"),
    },
    {
      key: "framesDecoded",
      name: t("debugStatsFramesDecoded"),
    },
    {
      key: "framesDecodedMissing",
      name: t("debugStatsFramesDecodedMissing"),
    },
    {
      key: "framesEncoded",
      name: t("debugStatsFramesEncoded"),
    },
    {
      key: "queuedForDecode",
      name: t("debugStatsQueuedForDecode"),
    },
    {
      key: "queuedForEncode",
      name: t("debugStatsQueuedForEncode"),
    },
    {
      key: "inDecoderQueue",
      name: t("debugStatsInDecoderQueue"),
    },
    {
      key: "inEncoderQueue",
      name: t("debugStatsInEncoderQueue"),
    },
  ];

  const statsTableRows = [];
  for (const stat of statsTableDef) {
    const value = props[stat.key];
    statsTableRows.push(
      <TableRow key={stat.key}>
        <TableCell>
          {stat.name}
        </TableCell>

        <TableCell>
          {value ?? "???"}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              colSpan={2}
            >
              <Stack
                alignItems="center"
                direction="row"
                justifyContent="center"
                spacing={0.5}
                sx={{ p: 1 }}
              >
                <SettingsIcon />

                <Typography variant="body1">
                  {t("debugStatsTitle")}
                </Typography>
              </Stack>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {statsTableRows}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

DebugStats.propTypes = {
  expectedFrames: PropTypes.number,
  framesDecoded: PropTypes.number,
  framesDecodedMissing: PropTypes.number,
  framesEncoded: PropTypes.number,
  inDecoderQueue: PropTypes.number,
  inEncoderQueue: PropTypes.number,
  queuedForDecode: PropTypes.number,
  queuedForEncode: PropTypes.number,
};

DebugStats.defaultProps = {
  expectedFrames: null,
  framesDecoded: null,
  framesDecodedMissing: null,
  framesEncoded: null,
  inDecoderQueue: null,
  inEncoderQueue: null,
  queuedForDecode: null,
  queuedForEncode: null,
};
