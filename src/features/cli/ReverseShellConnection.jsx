import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
}  from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { Box } from "@mui/system";

import {
  Card,
  CardContent,
  Collapse,
  CardHeader,
  IconButton,
  TextField,
  Button,
  useTheme,
} from "@mui/material";

import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { ExpandMore } from "@mui/icons-material";

import Spinner from "../loading/Spinner";
import { selectDisclaimersStatus } from "../settings/settingsSlice";

export default function ReverseShellConnection({ reverseShellSocket }) {
  const { t } = useTranslation("cli");
  const disclaimersStatus = useSelector(selectDisclaimersStatus);

  const translation = useTranslation("common");
  const tc = translation.t;

  const hostInputRef = React.useRef();

  const [expanded, setExpanded] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  const handleExpand = useCallback(() => setExpanded(!expanded), [expanded]);
  const handleClick = useCallback(async () => {
    if (connected) {
      reverseShellSocket.disconnect();
    } else {
      const defaultPort = 8000;
      const [host, port] = [...hostInputRef.current.value.split(":"), defaultPort]
        .map((v, idx) => idx === 1 ? parseInt(v) || defaultPort : v);
      await reverseShellSocket.connect(
        host, port
      );
      setConnecting(true);
    }
  }, [connected, reverseShellSocket, hostInputRef]);
  const theme = useTheme();

  useEffect(() => {
    const isConnected = reverseShellSocket.isConnected();
    setConnected(isConnected);
    setExpanded(isConnected);
    reverseShellSocket.setConnectionCallback((c) => {
      setConnecting(false);
      setConnected(c);
    });
  }, [reverseShellSocket]);

  return (
    <Card>
      <CardHeader
        action={
          <IconButton
            sx={{
              transform: !expanded ? "rotate(0deg)" : "rotate(180deg)",
              marginLeft: "auto",
              transition: theme.transitions.create(
                "transform",
                { duration: theme.transitions.duration.shortest }
              ),
            }}
          >
            <ExpandMore />
          </IconButton>
        }
        onClick={handleExpand}
        subheader="Reverse Shell"
      />

      <Collapse
        in={expanded}
        timeout="auto"
        unmountOnExit
      >
        <CardContent>
          {!disclaimersStatus &&
            <Alert severity="warning">
              <Typography>
                {t("description")}
              </Typography>

              <Typography>
                {t("warning")}
              </Typography>
            </Alert>}

          <Box sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          >
            <TextField
              defaultValue="localhost:8000"
              disabled={connected || connecting}
              inputRef={hostInputRef}
              label={t("label")}
              sx={{
                flexGrow: 4,
                m: 2,
              }}
              variant="standard"
            />

            <Button
              onClick={handleClick}
              sx={{
                flexGrow: 1,
                m: 2,
              }}
              variant="contained"
            >
              { connected ? tc("disconnect") : tc("connect") }
            </Button>

            {
              connecting && <Spinner text="" />
            }
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
}

ReverseShellConnection.propTypes = { reverseShellSocket: PropTypes.shape().isRequired };
