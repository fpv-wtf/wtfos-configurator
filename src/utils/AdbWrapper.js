import Proxy from "./Proxy";
const proxy = new Proxy("https://cors.bubblesort.me/?");

export default class AdbWrapper {
  constructor(adb) {
    this.adb = adb;
  }

  getDevice() {
    return this.adb.device;
  }

  async executeCommand(command) {
    return await this.adb.subprocess.spawnAndWait(command);
  }

  async installPackage(name) {
    return await this.executeCommand([
      "/opt/bin/opkg",
      "install",
      name,
    ]);
  }

  async removePackage(name) {
    return await this.executeCommand([
      "/opt/bin/opkg",
      "remove",
      name,
    ]);
  }

  async getPackages() {
    let output = await this.executeCommand([
      "/opt/bin/opkg",
      "list-installed",
    ]);

    console.log(output);

    if(output.exitCode !== 0) {
      throw new Error("Failed fetching installed packages.");
    }

    let lines = output.stdout.split("\n").filter((element) => element);
    const installed = lines.map((item) => {
      const fields = item.split(" - ");

      return fields[0];
    });

    output = await this.adb.subprocess.spawnAndWait([
      "/opt/bin/opkg",
      "list",
    ]);

    if(output.exitCode !== 0) {
      throw new Error("Failed fetching packages.");
    }

    lines = output.stdout.split("\n").filter((element) => element);
    const packages = lines.map((item) => {
      const fields = item.split(" - ");

      return {
        name: fields[0],
        version: fields[1],
        description: fields[2] || "",
        installed: installed.includes(fields[0]),
      };
    });

    return packages;
  }

  async getAvailableServices() {
    const blacklist = ["boot", "boot.d"];
    const output = await this.executeCommand([
      "ls",
      "/opt/etc/dinit.d",
    ]);
    let lines = output.stdout.split("\n").filter((element) => element);
    const services = lines.filter((element) => !blacklist.includes(element));

    return services;
  }

  async getEnabledServices() {
    const blacklist = ["boot"];
    const output = await this.executeCommand([
      "ls",
      "/opt/etc/dinit.d/*.d",
    ]);
    let lines = output.stdout.split("\n").filter((element) => element);
    const services = lines.filter((element) => !blacklist.includes(element));

    return services;
  }

  async getServicePids() {
    const blacklist = ["boot"];
    const output = await this.executeCommand([
      "HOME=/data",
      "/opt/bin/dinitctl",
      "-u",
      "list",
    ]);
    let lines = output.stdout.split("\n").filter((item) => item);
    let mapped = lines.map((item) => {
      const shortened = item.substring(11);
      const fields = shortened.split("(pid: ");

      return {
        name: fields[0].trim(),
        pid: fields.length > 1 ? fields[1].slice(0, -1) : null,
      };
    });
    mapped = mapped.filter((item) => !blacklist.includes(item.name));

    const pids = mapped.reduce((result, item) => {
      result[item.name] = item.pid;

      return result;
    }, {});

    return pids;
  }

  async getServices() {
    const available = await this.getAvailableServices();
    const enabled = await this.getEnabledServices();
    const pids = await this.getServicePids();

    const services = available.map((item) => {
      return {
        name: item,
        enabled: enabled.includes(item),
        pid: pids[item] || null,
      };
    });

    return services;
  }

  async enableService(name) {
    const output = await this.executeCommand([
      "HOME=/data",
      "/opt/bin/dinitctl",
      "-u",
      "enable",
      name,
    ]);

    return output.exitcode;
  }

  async disableService(name) {
    const output = await this.executeCommand([
      "HOME=/data",
      "/opt/bin/dinitctl",
      "-u",
      "disable",
      name,
    ]);

    return output.exitcode;
  }

  async getShellSocket() {
    return await this.adb.subprocess.shell();
  }

  async establishReverseSocket(port) {
    const remote = "tcp:8089";
    const local = `tcp:${port}`;

    // add permanent http proxy to opkg.conf
    // option http_proxy http://127.0.0.1:8089
    // or export before each proxied request:
    // export http_proxy="http://127.0.0.1:8089"
    const handler = (socket) => {
      const writer = socket.writable.getWriter();
      socket.readable.pipeTo(new WritableStream({
        write: async (chunk) => {
          try {
            const request = proxy.getRequestObject(chunk);
            const response = await proxy.proxyRequest(request);
            const buffer = await proxy.buildHttpResponse(response);

            writer.write(buffer);
          } catch(e) {
            console.log("Request failed", e);
          }
        },
      }));

      return true;
    };

    await this.adb.reverse.remove(remote).catch(() => { });
    return await this.adb.reverse.add(remote, local, handler);
  }
}
