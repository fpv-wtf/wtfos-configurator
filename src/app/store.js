import { configureStore } from "@reduxjs/toolkit";

import aboutReducer from "../features/about/aboutSlice";
import deviceReducer from "../features/device/deviceSlice";
import packagesReducer from "../features/packages/packagesSlice";
import rootReducer from "../features/root/rootSlice";
import startupReducer from "../features/startup/startupSlice";

export const store = configureStore({
  reducer: {
    about: aboutReducer,
    device: deviceReducer,
    packages: packagesReducer,
    root: rootReducer,
    startup: startupReducer,
  },
});
