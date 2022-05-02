import { configureStore } from "@reduxjs/toolkit";
import { AdbWebUsbBackendWatcher } from "@yume-chan/adb-backend-webusb";

import deviceReducer from "../features/device/deviceSlice";
import packagesReducer from "../features/packages/packagesSlice";
import startupReducer from "../features/startup/startupSlice";

export const store = configureStore({
  reducer: {
    device: deviceReducer,
    packages: packagesReducer,
    startup: startupReducer,
  },
});

function usbWatcher(store) {
  new AdbWebUsbBackendWatcher((id) => {
    if(!id) {
      store.dispatch({ type: "device/disconnected" });
    }
  });
}

usbWatcher(store);
