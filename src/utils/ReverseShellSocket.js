import {
  encodeUtf8,
  WritableStream,
} from "@yume-chan/adb";

export default class ReverseShellSocket {
  constructor(getShellSocket) {
    this.getShellSocket = getShellSocket;
    this.webSocket = undefined;
    this.connected = false;
  }

  onWsCloseHandler() {
    this.webSocket = undefined;
    this.connected = false;
    if (this.connectionCallback) {
      this.connectionCallback(false);
    }
  }

  isConnected() {
    return this.connected;
  }

  setConnectionCallback(callback) {
    this.connectionCallback = callback;
  }

  async connect(host, port) {
    if (this.connected) {
      this.disconnect();
    }
    const webSocket = new WebSocket(`ws://${host}:${port}`);
    webSocket.onerror = () => this.onWsCloseHandler(); // cant get error-msg, wtf?
    webSocket.onclose = () => this.onWsCloseHandler();
    webSocket.onopen = () => {
      webSocket.addEventListener("message", (event) => {
        event.data.text().then((txt)=> {
          writer.write(encodeUtf8(txt));
        }).catch((e) => {
          console.error(e);
        });
      });
      webSocket.addEventListener("close", () => this.onWsCloseHandler());
      this.connected = true;
      this.webSocket = webSocket;
      if (this.connectionCallback) {
        this.connectionCallback(true);
      }
    };

    const socket = await this.getShellSocket();
    const writer = socket.stdin.getWriter();
    socket.stdout.pipeTo(new WritableStream({
      write: (chunk) => {
        if (this.webSocket) {
          this.webSocket.send(chunk);
        }
      },
    }));
  }

  disconnect() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
}
