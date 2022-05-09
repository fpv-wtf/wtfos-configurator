import {
  escapeArg,
  WrapReadableStream,
} from "@yume-chan/adb";

import busybox from "./busybox";

import Proxy from "./Proxy";
const proxy = new Proxy("https://cors.bubblesort.me/?");

export default class AdbWrapper {
  constructor(adb) {
    this.adb = adb;

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
    };
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    const fullCommand = [
      "export PATH=$PATH:/opt/bin:/opt/sbin:/system/bin;",
      ...commandArray,
      ";echo $?",
    ];
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
    let upgradable = [];
    try {
      await this.updataPackages();
      const output = await this.executeCommand([
        this.wtfos.bin.opkg,
        "list-upgradable",
      ]);
      upgradable = output.stdout.split("\n").filter((element) => element);
      upgradable = upgradable.map((item) => {
        const fields = item.split(" - ");

        return {
          name: fields[0],
          current: fields[1],
          latest: fields[2],
        };
      });
    } catch(e) {
      console.log(e);
    }

    return upgradable;
  }

  async upgradePackages() {
    await this.executeCommand([
      this.wtfos.bin.opkg,
      "upgrade",
    ]);
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

    const repos = await this.getPackagesByRepo();
    const repoKeys = Object.keys(repos);

    lines = output.stdout.split("\n").filter((element) => element);
    const packages = lines.map((item) => {
      const fields = item.split(" - ");
      const name = fields[0];
      const repo = repoKeys.find((key) => {
        if(repos[key].includes(name)) {
          return key;
        }

        return false;
      });

      return {
        name: name,
        repo: repo,
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
      this.wtfos.bin.dinitctl,
      "-u list",
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
      this.wtfos.bin.dinitctl,
      "-u enable",
      escapeArg(name),
    ]);

    return output.exitcode;
  }

  async disableService(name) {
    const output = await this.executeCommand([
      "HOME=/data",
      this.wtfos.bin.dinitctl,
      "-u disable",
      escapeArg(name),
    ]);

    return output.exitcode;
  }

  async getShellSocket() {
    return await this.adb.subprocess.shell();
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

  async installWTFOS(statusCallback) {
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
        `export http_proxy="${this.wtfos.proxy}";`,
        "wget -q -O - http://bin.entware.net/armv7sf-k3.2/installer/alternative.sh | sh",
      ]);

      if(output.exitCode !== 0) {
        statusCallback("ERROR: Failed installing entware");
        console.log(output);
        return;
      }
    }

    const httpProxyOption = `option http_proxy ${this.wtfos.proxy}`;
    const repoOption = "src/gz fpv-wtf http://repo.fpv.wtf/pigeon";

    output = await this.executeCommand(`cat ${this.wtfos.config.opkg} | grep "${httpProxyOption}"`);
    if(output.exitCode !== 0) {
      statusCallback("Adding proxy option to opkg config...");

      this.executeCommand(`echo ${httpProxyOption} >> ${this.wtfos.config.opkg}`);
    }

    output = await this.executeCommand(`cat ${this.wtfos.config.opkg} | grep "${repoOption}"`);
    if(output.exitCode !== 0) {
      statusCallback("Adding WTFOS repo to opkg config...");

      this.executeCommand(`echo ${repoOption} >> ${this.wtfos.config.opkg}`);
    }

    statusCallback("Updating package list...");
    output = await this.executeCommand(
      `${this.wtfos.bin.opkg} update`
    );
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed updating package list");
      console.log(output);
      return;
    }

    statusCallback("Installing WTFOS (can take a couple of minutes)...");
    output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "install wtfos",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed installing WTFOS");
      console.log(output);
      return;
    }

    statusCallback("Starting dinit...");
    /**
     * This needs to be spawned, otherwise it will be blocked.
     * We can not use spawnAndWait here for that reason and just need to assume
     * that dinit startup worked out.
     */
    this.adb.subprocess.spawn([
      "HOME=/data",
      "/opt/bin/busybox nohup",
      this.wtfos.bin.dinit,
      "-u -d",
      this.wtfos.config.dinit,
      "&",
    ]);

    statusCallback("Setup done!");
  }

  async removeWTFOS(statusCallback) {
    statusCallback("Removing WTFOS packages...");
    let output = await this.executeCommand([
      this.wtfos.bin.opkg,
      "remove dinit wtfos wtfos-system",
      "--force-removal-of-dependent-packages",
    ]);
    if(output.exitCode !== 0) {
      statusCallback("ERROR: Failed removing WTFOS");
      console.log(output);
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
      console.log(output);
      return;
    }

    statusCallback("Removed WTFOS!");
  }
}
