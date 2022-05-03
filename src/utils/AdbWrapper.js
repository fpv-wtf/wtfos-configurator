import { escapeArg } from "@yume-chan/adb";

import Proxy from "./Proxy";
const proxy = new Proxy("https://cors.bubblesort.me/?");

export default class AdbWrapper {
  constructor(adb) {
    this.adb = adb;
  }

  getDevice() {
    return this.adb.device;
  }

  /**
   * Returns an object which should contain stdout, stderr and exitCode.
   * Unfortunately this only works on Android 7 and above, this means that
   * we will only have stdout to our disposal, but we can work around the
   * exit code problem by appending ";echo $?" to all our commands and then
   * parsing the last line manually, removing it and filling the exit code
   * ourselves.
   */
  async executeCommand(command) {
    const commandArray = Array.isArray(command) ? command : [command];
    const fullCommand = [...commandArray, ";echo $?"];
    const output = await this.adb.subprocess.spawnAndWait(fullCommand);
    let lines = output.stdout.split("\n");
    lines = lines.filter((line) => line);
    const exitCode = lines.pop();

    output.exitCode = parseInt(exitCode);
    output.stdout = lines.join("\n");

    return output;
  }

  async installPackage(name) {
    return await this.executeCommand([
      "/opt/bin/opkg",
      "install",
      escapeArg(name),
    ]);
  }

  async removePackage(name) {
    return await this.executeCommand([
      "/opt/bin/opkg",
      "remove",
      escapeArg(name),
    ]);
  }

  async updataPackages() {
    const output = await this.adb.subprocess.spawnAndWait([
      "/opt/bin/opkg",
      "update",
    ]);

    return output;
  }

  async getPackages() {
    let output = await this.executeCommand([
      "/opt/bin/opkg",
      "list-installed",
    ]);

    if(output.exitCode !== 0) {
      throw new Error("Failed fetching installed packages.");
    }

    let lines = output.stdout.split("\n").filter((element) => element);
    const installed = lines.map((item) => {
      const fields = item.split(" - ");

      return fields[0];
    });

    await this.updataPackages();
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
      escapeArg(name),
    ]);

    return output.exitcode;
  }

  async disableService(name) {
    const output = await this.executeCommand([
      "HOME=/data",
      "/opt/bin/dinitctl",
      "-u",
      "disable",
      escapeArg(name),
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
            const buffer = await proxy.getResponseBuffer(response);

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

  async fileExists(path) {
    const output = await this.executeCommand([
      "test",
      "-f",
      path,
    ]);

    return output.exitCode === 0;
  }
}
