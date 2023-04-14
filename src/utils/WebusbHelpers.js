/**
 * Check if device has ADB interface
 *
 * @param {Object} USBDevice - the USB device to check for ADB interface
 * @returns {boolean}
 */
const hasAdb = (device) => {
  for(let i = 0; i < device.configurations.length; i += 1) {
    const configuration = device.configurations[i];
    const interfaces = configuration.interfaces;

    for(let j = 0; j < interfaces.length; j += 1) {
      /**
       * We are looking for a custom interface with a specific subclass
       * and two endpoints:
       * class    255 - 0xFF
       * subclass  66 - 0x42
       */
      const currentInterface = interfaces[j].alternate;
      if (
        currentInterface.interfaceClass === 0xFF &&
        currentInterface.interfaceSubclass === 0x42 &&
        currentInterface.endpoints.length === 2
      ) {
        return true;
      }
    }
  }

  return false;
};

const timeout = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export {
  hasAdb,
  timeout,
};
