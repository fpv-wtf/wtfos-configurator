import { createSlice } from "@reduxjs/toolkit";

import { loadDisclaimersState } from "../../utils/LocalStorage";

const initialState = { hasEnabledDisclaimers: loadDisclaimersState() };

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    persistDisclaimersStatus: (state, action) => {
      localStorage.setItem("disclaimersState", action.payload);
      state.hasEnabledDisclaimers = action.payload;
    },
  },
});

export const { persistDisclaimersStatus } = settingsSlice.actions;

export const selectDisclaimersStatus = (state) => state.settings.hasEnabledDisclaimers;

export default settingsSlice.reducer;
