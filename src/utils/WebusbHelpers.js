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
      const currentInterface = interfaces[j].alternate;
      if (currentInterface.interfaceClass === 0xFF) {
        return true;
      }
    }
  }

  return false;
};

export {
  hasAdb,
};
