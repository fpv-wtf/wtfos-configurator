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

  /**
   * Called upon receiving data from the websocket
   * @param {*} callback callback(data)  must write to adb socket
   */
  onData(callback) {
    this.onDataCallback = callback;
  }

  write(data) {
    if (this.webSocket) {
      this.webSocket.send(data);
    }
  }

  async connect(host, port) {
    if (this.connected) {
      this.disconnect();
    }
    const socket = await this.getShellSocket();
    const writer = socket.stdin.getWriter();
    socket.stdout.pipeTo(new WritableStream({
      write: (chunk) => {
        if (this.webSocket) {
          this.webSocket.send(chunk);
        }
      },
    }));
    const webSocket = new WebSocket(`wss://${host}:${port}`);
    webSocket.onerror = () => this.onWsCloseHandler(); // cant get error-msg, wtf?
    webSocket.onclose = () => this.onWsCloseHandler();
    webSocket.onopen = () => {
      webSocket.addEventListener("message", (event) => {
        event.data.text().then((txt)=> {
          // prevents doubled inputs
          // dataCallback should also write to socket, or else this breaks
          if (this.onDataCallback) {
            this.onDataCallback(txt);
          } else {
            writer.write(encodeUtf8(txt));
          }
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
  }

  disconnect() {
    if (this.webSocket) {
      this.webSocket.close();
    }
  }
}
