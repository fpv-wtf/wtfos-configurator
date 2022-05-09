import { configureStore } from "@reduxjs/toolkit";

import deviceReducer from "../features/device/deviceSlice";
import packagesReducer from "../features/packages/packagesSlice";
import rootReducer from "../features/root/rootSlice";
import startupReducer from "../features/startup/startupSlice";

export const store = configureStore({
  reducer: {
    device: deviceReducer,
    packages: packagesReducer,
    root: rootReducer,
    startup: startupReducer,
  },
});
