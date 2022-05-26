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
import { ExpandMore } from "@mui/icons-material";

import Spinner from "../loading/Spinner";

export default function ReverseShellConnection({ reverseShellSocket }) {

  const hostInputRef = React.useRef();
  const portInputRef = React.useRef();

  const [expanded, setExpanded] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  const handleExpand = useCallback(() => setExpanded(!expanded), [expanded]);
  const handleClick = useCallback(async () => {
    if (connected) {
      reverseShellSocket.disconnect();
    } else {
      await reverseShellSocket.connect(
        hostInputRef.current.value,
        portInputRef.current.value
      );
      setConnecting(true);
    }
  }, [connected, reverseShellSocket, hostInputRef, portInputRef]);
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
          <Box sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          >
            <TextField
              defaultValue="localhost"
              disabled={connected || connecting}
              inputRef={hostInputRef}
              label="Host"
              sx={{
                flexGrow: 4,
                m: 2,
              }}
              variant="standard"
            />

            <TextField
              defaultValue={8000}
              disabled={connected || connecting}
              inputRef={portInputRef}
              label="Port"
              sx={{
                flexGrow: 2,
                m: 2,
              }}
              type="number"
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
