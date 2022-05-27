import PropTypes from "prop-types";
import React, {
  useCallback,
  useEffect,
}  from "react";

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

export default function ReverseShellConnection({ reverseShellSocket }) {

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
          <Alert severity="warning">
            <Typography>
              This feature allows you to hand over complete control of your device to a third party.
            </Typography>

            <Typography>
              Only use this if you know what you are doing and only ever connect to trusted individuals.
            </Typography>
          </Alert>

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
              label="Host:Port"
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
              { connected ? "Disconnect" : "Connect" }
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
