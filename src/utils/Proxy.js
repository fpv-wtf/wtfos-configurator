export default class Proxy {
  constructor(corsProxy) {
    this.corsProxy = corsProxy;
  }

  /**
   * Build a request objact from a buffer
   *
   * Caution: this only handles requests  without a body.
   */
  getRequestObject(buffer) {
    const decoder = new TextDecoder();
    const string = decoder.decode(buffer);
    const lines = string.split("\n");
    if(lines.length > 0) {
      const requestLine = lines[0];
      const fields = requestLine.split(" ");
      if(fields.length >= 2) {
        const method = fields[0];
        const url = fields[1];

        const request = new Request(url, { method });
        return request;
      }

      throw new Error("Filed count does not match.");
    }

    throw new Error("Buffer is empty.");
  }

  async getResponseBuffer(response) {
    const header = `HTTP/1.1 ${response.status} ${response.statusText}`;
    const lines = [header];
    for(let entry of response.headers.entries()) {
      lines.push(entry.join(": "));
    }
    lines.push("\n");
    const headerString =  lines.join("\n");

    const encoder = new TextEncoder();
    const headerBuffer = encoder.encode(headerString);

    let responseContentBuffer = await response.arrayBuffer();
    responseContentBuffer = new Uint8Array(responseContentBuffer);

    const responseBuffer = new Uint8Array([...headerBuffer, ...responseContentBuffer]);
    return responseBuffer;
  }

  /**
   * Try to execute the request - if it fials the first time, chances are it
   * failed because of a CORS error, in this case try to fetch it again using
   * a CORS proxy.
   */
  async proxyRequest(request) {
    let response = null;
    try {
      response = await fetch(request);
      return response;
    } catch(e) {
      const corsProxyUrl = this.corsProxy + request.url;
      const corsRequest = new Request(corsProxyUrl);
      try {
        response = await fetch(corsRequest);
        return response;
      } catch(e) {
        throw new Error("Could not fetch regularly nor via CORS proxy");
      }
    }
  }
}
