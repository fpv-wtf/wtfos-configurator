import { configureStore } from "@reduxjs/toolkit";

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
