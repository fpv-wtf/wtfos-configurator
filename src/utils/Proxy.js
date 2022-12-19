export default class Proxy {
  constructor(corsProxy) {
    this.corsProxy = corsProxy;
  }

  /**
   * Get URL and method from a http request buffer
   *
   * Caution: this only handles requests  without a body.
   */
  getRequestFiledsBuffer(buffer) {
    const decoder = new TextDecoder();
    const string = decoder.decode(buffer);
    const lines = string.split("\n");
    if(lines.length > 0) {
      const requestLine = lines[0];
      const fields = requestLine.split(" ");
      if(fields.length >= 2) {
        const method = fields[0];
        const url = fields[1];

        return {
          method,
          url,
        };
      }

      throw new Error("Fileds count does not match.");
    }

    throw new Error("Buffer is empty.");
  }

  async getResponseBuffer(response) {
    const header = `HTTP/1.1 ${response.status} ${response.statusText}`;
    const lines = [header];

    let responseContentBuffer = await response.arrayBuffer();
    responseContentBuffer = new Uint8Array(responseContentBuffer);

    for(let entry of response.headers.entries()) {
      if(entry[0].toLowerCase() === "content-length") {
        lines.push(entry[0] + ": " + responseContentBuffer.length);
      }
      else {
        lines.push(entry.join(": "));
      }
    }
    lines.push("\n");
    const headerString =  lines.join("\n");

    const encoder = new TextEncoder();
    const headerBuffer = encoder.encode(headerString);

    const responseBuffer = new Uint8Array([...headerBuffer, ...responseContentBuffer]);
    return responseBuffer;
  }

  /**
   * Try to execute the request - if it fials the first time, chances are it
   * failed because of a CORS error, in this case try to fetch it again using
   * a CORS proxy.
   */
  async proxyRequest(buffer) {
    const {
      method,
      url,
    } = this.getRequestFiledsBuffer(buffer);

    /**
     * Rewrite http:// to https://
     *
     * If https is not available it will fallback to the cors request
     * with the original url anyway.
     */
    const httpsUrl = url.replace(/^http:\/\//, "https://");

    let response = null;
    try {
      const request = new Request(httpsUrl, { method });
      response = await fetch(request);
      return response;
    } catch(e) {
      const corsProxyUrl = this.corsProxy + url;
      const corsRequest = new Request(corsProxyUrl, { method });
      try {
        response = await fetch(corsRequest);
        return response;
      } catch(e) {
        throw new Error("Could not fetch regularly nor via CORS proxy");
      }
    }
  }
}
