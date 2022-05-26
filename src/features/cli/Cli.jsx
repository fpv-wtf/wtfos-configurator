import PropTypes from "prop-types";
import React, { useEffect } from "react";

import {
  encodeUtf8,
  WritableStream,
} from "@yume-chan/adb";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";

import { XTerm } from "xterm-for-react";
import { FitAddon } from "xterm-addon-fit";

import ReverseShellConnection from "./ReverseShellConnection";

const fitAddon = new FitAddon();

export default function Cli({ adb }) {
  const xtermRef = React.useRef(null);

  useEffect(() => {
    const terminal = xtermRef.current.terminal;

    const setup = async() => {
      const socket = await adb.getShellSocket();
      const writer = socket.stdin.getWriter();
      const reverseShellSocket = adb.getReverseShellSocket();

      socket.stdout.pipeTo(new WritableStream({
        write: (chunk) => {
          terminal.write(chunk);
          reverseShellSocket.write(chunk);
        },
      }));

      const onDataFn = (data) => {
        const buffer = encodeUtf8(data);
        writer.write(buffer);
      };
      terminal.onData(onDataFn);
      reverseShellSocket.onData(onDataFn);
    };
    setup();
  }, [adb]);

  return (
    <Container
      fixed
      sx={{ paddingBottom: 3 }}
    >
      <Stack
        marginBottom={2}
        marginTop={2}
      >
        <XTerm
          addons={[fitAddon]}
          options={{
            letterSpacing: 1,
            cursorBlink: true,
            cursorStyle: "bar",
            fontFamily: "\"Cascadia Code\", Consolas, monospace, \"Source Han Sans SC\", \"Microsoft YaHei\"",
          }}
          ref={xtermRef}
        />

        <ReverseShellConnection
          reverseShellSocket={adb.getReverseShellSocket()}
        />
      </Stack>
    </Container>
  );
}

Cli.propTypes = { adb: PropTypes.shape().isRequired };
