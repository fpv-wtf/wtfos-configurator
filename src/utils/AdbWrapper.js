import { Buffer } from "buffer";

import {
  escapeArg,
  WrapReadableStream,
} from "@yume-chan/adb";

import busybox from "./busybox";

import Proxy from "./Proxy";
import ReverseShellSocket from "./ReverseShellSocket";
import { parsePackageIndex } from "./OpkgHelpers";

const proxy = new Proxy("https://cors.bubblesort.me/?");

export default class AdbWrapper {
  constructor(adb) {
    this.adb = adb;
    this.reverseShellSocket = new ReverseShellSocket(() => this.getShellSocket());

    this.wtfos = {
      path: "/blackbox/wtfos",
      bin: {
        busybox: "/opt/bin/busybox",
        dinit: "/opt/sbin/dinit",
        dinitctl: "/opt/sbin/dinitctl",
        opkg: "/opt/bin/opkg",
      },
      config: {
        dinit: "/opt/etc/dinit.d",
        opkg: "/opt/etc/opkg.conf",
      },
      proxy: "http://127.0.0.1:8089",
      linkFunctions: ["wget"],
      opkgLists: "/opt/var/opkg-lists",
      entwareInstallerUrl: "http://bin.entware.net/armv7sf-k3.2/installer/alternative.sh",
      opkgConfigUrl: "http://repo.fpv.wtf/pigeon/wtfos-opkg-config_armv7-3.2.ipk",
      healthchecksUrl: "https://github.com/fpv-wtf/wtfos-healthchecks/releases/latest/download/healthchecks.tar.gz",
      healthchesksPath: "/tmp/healthchecks",
      packageConfigPath: "/opt/etc/package-config",
      packageConfigFile: "config.json",
      packageConfigSchema: "schemaV2.json",
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getDevice() {
    return this.adb.device;
  }

  getReverseShellSocket() {
    return this.reverseShellSocket;
  }

  filterInvalidPackages = (item) => {
    return item.installed || (!!item.version && !item.name?.includes(" "));
  };

  splitPackageString = (item) => {
    const delimiter = " - ";
    const fields = item.split(delimiter);

    return {
      name: fields[0],
      version: fields[1],
      description: fields[2] ? fields.slice(2).join(delimiter) : "",
    };
  };

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
    const fullCommand = [
      ". /etc/mkshrc;",
      ...commandArray,
      ";echo $?",
    ];
    const output = await this.adb.subprocess.spawnAndWait(fullCommand);
    let lines = output.stdout.split("\n");
    lines = lines.filter((line) => line);
    const exitCode = lines.pop();

    // Remove first line in case it is reporting the debug state which might
    // happen on some devices when sourcing /etc/mkshrc
    if(lines.length > 0) {
      if(lines[0].startsWith("[sec_debug_state")) {
        lines.shift();
      }
    }

    output.exitCode = parseInt(exitCode);
    output.stdout = lines.join("\n");

    return output;
  }

  async installPackage(name) {
    return await this.executeCommand([
      this.wtfos.bin.opkg,
      "install",
      escapeArg(name),
    ]);
  }

  async removePackage(name) {
    return await this.executeCommand([
      this.wtfos.bin.opkg,
      "remove",
      escapeArg(name),
      "--force-removal-of-dependent-packages",
    ]);
  }

  async getRepos() {
    const output = await this.executeCommand(`ls ${this.wtfos.opkgLists}`);
    const repos = output.stdout.split("\n");

    return repos;
  }

  async getPackagesByRepo() {
    const repos = await this.getRepos();
    const packages = {};
    for(let repo of repos) {
      const output = await this.executeCommand([
        "gunzip -c",
        `${this.wtfos.opkgLists}/${repo}`,
        "| grep 'Package:' | cut -d ' ' -f2",
      ]);
      const lines = output.stdout.split("\n");
      packages[repo] = lines;
    }

    return packages;
  }

  async updataPackages() {
    const output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "update",
    ]);

    return output;
  }

  async getUpgradablePackages() {
    const delimiter = " - ";

    let upgradable = [];
    try {
      await this.updataPackages();
      const output = await this.executeCommand([
        this.wtfos.bin.opkg,
        "list-upgradable",
      ]);

      upgradable = output.stdout.split("\n").filter((line) => line);
      upgradable = upgradable.filter((line) => {
        const fields = line.split(delimiter);

        return fields.length === 3;
      });

      upgradable = upgradable.map((item) => {
        const fields = item.split(delimiter);

        return {
          name: fields[0],
          current: fields[1],
          latest: fields.slice(2).join(delimiter),
        };
      });
    } catch(e) {
      console.log(e);
    }

    return upgradable;
  }

  async upgradePackages(callback) {
    const output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "upgrade",
    ]);

    if(callback) {
      const log = output.stdout.split("\n").filter((line) => line);
      callback(log);
    }
  }

  async getDetailedPackageInfo(repo) {
    const output = await this.executeCommand([
      "gunzip -c",
      `${this.wtfos.opkgLists}/${repo}`,
    ]);

    return parsePackageIndex(output.stdout);
  }

  async getPackageDetails(name) {
    const packages = await this.getPackages();
    const pkg = packages.find((pkg) => pkg.name === name);

    return pkg;
  }

  async getPackages() {
    let output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "list-installed",
    ]);

    if(output.exitCode !== 0) {
      throw new Error("Failed fetching installed packages.");
    }

    let lines = output.stdout.split("\n").filter((element) => element);
    const installed = lines.map((item) => {
      const fields = this.splitPackageString(item);

      return fields.name;
    });

    await this.updataPackages();
    output = await this.adb.subprocess.spawnAndWait([
      this.wtfos.bin.opkg,
      "list",
    ]);

    if(output.exitCode !== 0) {
      throw new Error("Failed fetching packages.");
    }

    const repos = await this.getPackagesByRepo();
    const repoKeys = Object.keys(repos);

    const details = await this.getDetailedPackageInfo("fpv-wtf");

    lines = output.stdout.split("\n").filter((element) => element);
    const packages = lines.map((item) => {
      const fields = this.splitPackageString(item);

      const repo = repoKeys.find((key) => {
        if(repos[key].includes(fields.name)) {
          return key;
        }

        return false;
      });

      return {
        name: fields.name,
        repo: repo,
        version: fields.version,
        description: fields.description,
        installed: installed.includes(fields.name),
        details: details[fields.name] || {},
      };
    }).filter(this.filterInvalidPackages);

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

  async getServiceInfo() {
    const blacklist = ["boot"];
    const output = await this.executeCommand([
      this.wtfos.bin.dinitctl,
      "-u list",
    ]);
    let lines = output.stdout.split("\n").filter((item) => item);
    let mapped = lines.map((item) => {
      const encodedStatus = item.substring(0, 10);
      const shortened = item.substring(11);
      const fields = shortened.split("(pid: ");

      const hasPid = fields.length > 1;
      let status = hasPid ? "running" : "stopped";
      if(!hasPid) {
        // Could be a script - if enabled and no PID
        const started = /{\+}/.test(encodedStatus);
        status = started ? "started" : "stopped";
      }

      return {
        status,
        name: fields[0].trim(),
        pid: hasPid ? fields[1].slice(0, -1) : null,
      };
    });
    mapped = mapped.filter((item) => !blacklist.includes(item.name));

    const pids = mapped.reduce((result, item) => {
      result[item.name] = {
        pid: item.pid,
        status: item.status,
      };

      return result;
    }, {});

    return pids;
  }

  async getServices() {
    const available = await this.getAvailableServices();
    const enabled = await this.getEnabledServices();
    const info = await this.getServiceInfo();

    const services = available.map((item) => {
      return {
        name: item,
        enabled: enabled.includes(item),
        info: info[item] || null,
      };
    });

    return services;
  }

  async enableService(name) {
    const output = await this.executeCommand([
      this.wtfos.bin.dinitctl,
      "-u enable",
      escapeArg(name),
    ]);

    return output.exitCode;
  }

  async disableService(name) {
    const output = await this.executeCommand([
      this.wtfos.bin.dinitctl,
      "-u disable",
      escapeArg(name),
    ]);

    return output.exitCode;
  }

  async restartService(name) {
    const output = await this.executeCommand([
      this.wtfos.bin.dinitctl,
      "-u restart",
      escapeArg(name),
    ]);

    return output.exitCode;
  }

  async getShellSocket() {
    return await this.adb.subprocess.shell();
  }

  async getTemperature() {
    const output = await this.executeCommand([
      "cat /sys/devices/platform/soc/f0a00000.apb/f0a71000.omc/temp1",
    ]);

    return output.stdout;
  }

  async getPackageConfig(name) {
    const configPath = `${this.wtfos.packageConfigPath}/${name}/${this.wtfos.packageConfigFile}`;
    const schemaPath = `${this.wtfos.packageConfigPath}/${name}/${this.wtfos.packageConfigSchema}`;

    try {
      const config = await this.pullJsonFile(configPath);
      const schema = await this.pullJsonFile(schemaPath);

      return {
        config,
        schema,
      };
    } catch(e) {
      console.log("Failed fetching package config", e);
    }

    return {
      config: null,
      schema: null,
    };
  }

  // Returns a JSON object from the contents of a file at the given path
  async pullJsonFile(path) {
    const data = await this.pullFile(path);
    const string = new TextDecoder().decode(data);
    const json = JSON.parse(string);

    return json;
  }

  async pullFile(path) {
    const sync = await this.adb.sync();
    const stream = await sync.read(path);
    const reader = stream.getReader();

    let data = new Buffer.from([]);
    let notDone = true;
    while(notDone) {
      let {
        done,
        value,
      } = await reader.read();

      if(value) {
        data = Buffer.concat([data, value]);
      }

      notDone = !done;
    }

    return data;
  }

  async pushFile(path, blob) {
    const stream = new WrapReadableStream(blob.stream());
    const sync = await this.adb.sync();
    await stream.pipeTo(sync.write(path));
  }

  async writePackageConfig(packageName, content, units = []) {
    const path = `${this.wtfos.packageConfigPath}/${packageName}/${this.wtfos.packageConfigFile}`;
    const blob = new Blob([content]);
    await this.pushFile(path, blob);

    if(units) {
      for(let i = 0; i < units.length; i += 1) {
        const unit = units[i];
        const result = await this.restartService(unit);
        if(result !== 0) {
          throw new Error(`Failed restarting ${unit}`);
        }
      }
    }
  }

  async getProductInfo() {
    let output = await this.executeCommand([
      "unrd product_type",
    ]);
    const productType = output.stdout;

    output = await this.executeCommand([
      "getprop ro.product.device",
    ]);
    const device = output.stdout;

    return {
      productType,
      device,
    };
  }

  /**
   * The port here does not really matter. It is just used to identify it in
   * the handler later on.
   */
  async establishReverseSocket(port) {
    const remote = "tcp:8089";
    const local = `tcp:${port}`;

    const handler = (socket) => {
      const writer = socket.writable.getWriter();
      socket.readable.pipeTo(new WritableStream({
        write: async (chunk) => {
          try {
            const response = await proxy.proxyRequest(chunk);
            const buffer = await proxy.getResponseBuffer(response);

            writer.write(buffer);
          } catch(e) {
            console.log("Request failed", e);
          }
        },
      }));

      return true;
    };

    await this.adb.reverse.remove(remote).catch(() => {});
    return await this.adb.reverse.add(remote, local, handler);
  }

  async fileExists(path) {
    const output = await this.executeCommand([
      "test -f",
      escapeArg(path),
    ]);

    return output.exitCode === 0;
  }

  async dirExists(path) {
    const output = await this.executeCommand([
      "test -d",
      escapeArg(path),
    ]);

    return output.exitCode === 0;
  }

  async installWTFOS(statusCallback, setRebooting) {
    const binPath = `${this.wtfos.path}/opt/bin`;

    // Check for supported devices
    const validDevices = ["wm150", "wm170"];
    let output = await this.executeCommand("getprop ro.product.device");
    const device = output.stdout;

    const match = validDevices.find((item) => device.includes(item));
    if(!match) {
      statusCallback(`Device "${device}" not supported. Aborted...`);
      return;
    }

    statusCallback(`Found "${device}"`);
    let exists = await this.dirExists(`${this.wtfos.path}/opt/bin/`);
    if(!exists) {
      statusCallback("Creating basic directory structure...");
      await this.executeCommand(`mkdir -p ${this.wtfos.path}/opt/bin`);
    }

    exists = await this.fileExists("/bin/sh");
    if(!exists) {
      statusCallback("Remounting file-system...");

      await this.executeCommand("mount -o rw,remount /");
      await this.executeCommand("mkdir -p /bin");
      await this.executeCommand("ln -sf /system/bin/sh /bin/sh");

      exists = await this.fileExists("/opt");
      if(!exists) {
        await this.executeCommand(`ln -sf ${this.wtfos.path}/opt /opt`);
      }

      await this.executeCommand("mount -o ro,remount /");
    }

    exists = await this.fileExists(`${this.wtfos.bin.busybox}`);
    if(!exists) {
      statusCallback("Moving busybox into place...");

      // Unfortunately we need to keep the file locally since we can not fetch
      // it from the busybox site - not even via CORS proxy.
      const response = await fetch(busybox);
      const blob = await response.blob();
      const file = new File([blob], "busybox");

      const stream = new WrapReadableStream(file.stream());
      const sync = await this.adb.sync();
      await stream.pipeTo(sync.write(this.wtfos.bin.busybox));
      await this.executeCommand(`chmod u+x ${this.wtfos.bin.busybox}`);
    }

    for(const func of this.wtfos.linkFunctions) {
      exists = await this.fileExists(`${binPath}/${func}`);
      if(!exists) {
        statusCallback(`Linking ${func}...`);
        await this.executeCommand(`ln -sf ${this.wtfos.bin.busybox} ${binPath}/${func}`);
      }
    }

    exists = await this.fileExists(this.wtfos.bin.opkg);
    if(!exists) {
      statusCallback("Installing entware (can take a couple of minutes)...");
      output = await this.executeCommand([
        "export PATH=$PATH:/opt/bin:/opt/sbin:/system/bin;",
        `export http_proxy="${this.wtfos.proxy}";`,
        `wget -q -O - ${this.wtfos.entwareInstallerUrl} | sh`,
      ]);

      if(output.exitCode !== 0) {
        statusCallback("ERROR: Failed installing entware");
        output.stdout.split("\n").forEach((line) => statusCallback(line));
        return;
      }
    }

    statusCallback("Updating opkg.config with WTFOS settings...");
    output = await this.executeCommand([
      "export PATH=$PATH:/opt/bin:/opt/sbin:/system/bin;",
      `export http_proxy="${this.wtfos.proxy}";`,
      "cd /tmp &&",
      `wget -q -nc ${this.wtfos.opkgConfigUrl} &&`,
      `${this.wtfos.bin.opkg} install wtfos-opkg-config*`,
    ]);

    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed updating opkg.config");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    statusCallback("Updating package list...");
    output = await this.executeCommand([
      "export PATH=$PATH:/opt/bin:/opt/sbin:/system/bin;",
      `${this.wtfos.bin.opkg} update`,
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed updating package list");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    statusCallback("Installing WTFOS (can take a couple of minutes)...");
    output = await this.executeCommand([
      "export PATH=$PATH:/opt/bin:/opt/sbin:/system/bin;",
      this.wtfos.bin.opkg,
      "install wtfos",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed installing WTFOS");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    statusCallback("Rebooting...");
    await this.executeCommand("sync");
    await this.executeCommand("reboot");

    setRebooting();
  }

  async installHealthchecks(statusCallback, doneCallback) {
    const healthcheksDirExists = await this.dirExists(this.wtfos.healthchesksPath);
    if(!healthcheksDirExists) {
      statusCallback("Fetching Healthcheck package...");
      try {
        const buffer = Buffer.from(`GET ${this.wtfos.healthchecksUrl}?cachebust=${Math.random()}`);
        const response = await proxy.proxyRequest(buffer);
        const blob = await response.blob();
        await this.pushFile("/tmp/healthchecks.tar.gz", blob);
      } catch(e) {
        statusCallback("ERROR: Failed fetching Healthchecks");
        return;
      }

      statusCallback("Extracting Healthcheck package...");
      let output = await this.executeCommand([
        "busybox gunzip -c /tmp/healthchecks.tar.gz | tar -x -C /tmp",
      ]);
      if(output.exitCode !== 0) {
        statusCallback("ERROR: Failed extracting Healthchecks");
        output.stdout.split("\n").forEach((line) => statusCallback(line));
        return;
      }
    }

    doneCallback();
  }

  async runHealthcheckFix(path, statusCallback, doneCallback) {
    statusCallback(`Running: ${path} fix`);
    let output = await this.executeCommand([
      "sh",
      path,
      "fix",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Automated fix failed");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    doneCallback();
  }

  async runHealthcheckUnits(statusCallback) {
    statusCallback("Gathering available healthchecks...");
    let output = null;
    output = await this.executeCommand([
      "ls /tmp/healthchecks/units",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed listing Healthchecks");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    const units = output.stdout.split("\n").map((item) => {
      return {
        id: item.split("-")[0],
        name: item.split("-").slice(1).join("-").split(".").slice(0, -1).join("."),
        path: `/tmp/healthchecks/units/${item}`,
        passed: false,
        fixable: false,
        output: [],
      };
    });

    for(let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      const path = unit.path;

      statusCallback(`Running ${path}`);
      output = await this.executeCommand([
        "sh",
        path,
      ]);

      unit.passed = output.exitCode === 0;
      unit.fixable = output.exitCode === 2;
      unit.output = output.stdout.split("\n");
    }

    return units;
  }

  async removeWTFOS(statusCallback, setRebooting) {
    statusCallback("Removing WTFOS packages...");
    let output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "remove dinit wtfos wtfos-system",
      "--force-removal-of-dependent-packages",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed removing WTFOS");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    statusCallback("Cleaning up...");
    output = await this.executeCommand("mount -o rw,remount /");
    output = await this.executeCommand("rm -r /bin");
    output = await this.executeCommand("rm -r /opt");
    output = await this.executeCommand("mount -o ro,remount /");

    output = await this.executeCommand(`rm -r ${this.wtfos.path}`);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed cleaning up");
      output.stdout.split("\n").forEach((line) => statusCallback(line));
      return;
    }

    statusCallback("Rebooting...");
    await this.executeCommand("sync");
    await this.executeCommand("reboot");

    setRebooting();
  }
}
