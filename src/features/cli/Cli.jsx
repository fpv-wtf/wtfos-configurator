import PropTypes from "prop-types";
import React, { useEffect } from "react";

import {
  encodeUtf8,
  WritableStream,
} from "@yume-chan/adb";

import { XTerm } from "xterm-for-react";
import { FitAddon } from "xterm-addon-fit";

const fitAddon = new FitAddon();

export default function Cli({ adb }) {
  const xtermRef = React.useRef(null);

  useEffect(() => {
    const terminal = xtermRef.current.terminal;

    const setup = async() => {
      const socket = await adb.getShellSocket();
      const writer = socket.stdin.getWriter();

      socket.stdout.pipeTo(new WritableStream({
        write: (chunk) => {
          terminal.write(chunk);
        },
      }));

      terminal.onData((data) => {
        const buffer = encodeUtf8(data);
        writer.write(buffer);
      });
    };
    setup();
  }, [adb]);

  return (
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
  );
}

Cli.propTypes = { adb: PropTypes.shape().isRequired };
