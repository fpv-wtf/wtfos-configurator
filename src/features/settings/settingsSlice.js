import { createSlice } from "@reduxjs/toolkit";

import { loadDisclaimersState } from "../../utils/LocalStorage";

const initialState = { hasEnabledDisclaimers: loadDisclaimersState() };

export const rootSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    persistDisclaimersStatus: (state, action) => {
      localStorage.setItem("disclaimersState", action.payload);
      state.hasEnabledDisclaimers = action.payload;
    },
  },
});

export const { persistDisclaimersStatus } = rootSlice.actions;

export const selectDisclaimersStatus = (state) => state.settings.hasEnabledDisclaimers;

export default rootSlice.reducer;
