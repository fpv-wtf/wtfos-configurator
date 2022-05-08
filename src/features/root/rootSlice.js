import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  attempted: false,
  rooting: false,
  success: false,
  log: [],
};

export const rootSlice = createSlice({
  name: "root",
  initialState,
  reducers: {
    root: (state) => {
      state.attempted = true;
      state.log = [];
      state.rooting = true;
      state.success = false;
    },
    success: (state) => {
      state.rooting = false;
      state.success = true;
    },
    fail: (state) => {
      state.rooting = false;
      state.success = false;
    },
    clearLog: (state) => {
      state.log = [];
    },
    appendToLog: (state, action) => {
      state.log = [...state.log, action.payload];
    },
    reset: (state) => {
      state = { ...initialState };
    },
  },
});

export const {
  appendToLog,
  clearLog,
  fail,
  reset,
  root,
  success,
} = rootSlice.actions;

export const selectAttempted = (state) => state.root.attempted;
export const selectLog = (state) => state.root.log;
export const selectRooting = (state) => state.root.rooting;
export const selectSuccess = (state) => state.root.success;

export default rootSlice.reducer;
