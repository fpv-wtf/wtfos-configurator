import { configureStore } from "@reduxjs/toolkit";

import aboutReducer from "../features/about/aboutSlice";
import deviceReducer from "../features/device/deviceSlice";
import donateReducer from "../features/donate/donateSlice";
import healthcheckReducer from "../features/healthcheck/healthcheckSlice";
import packagesReducer from "../features/packages/packagesSlice";
import packageReducer from "../features/package/packageSlice";
import rootReducer from "../features/root/rootSlice";
import settingsReducer from "../features/settings/settingsSlice";
import startupReducer from "../features/startup/startupSlice";
import tabGovernor from "../features/tabGovernor/tabGovernorSlice";

export const store = configureStore({
  reducer: {
    about: aboutReducer,
    device: deviceReducer,
    donate: donateReducer,
    healthcheck: healthcheckReducer,
    packages: packagesReducer,
    package: packageReducer,
    root: rootReducer,
    settings: settingsReducer,
    startup: startupReducer,
    tabGovernor: tabGovernor,
  },
});
