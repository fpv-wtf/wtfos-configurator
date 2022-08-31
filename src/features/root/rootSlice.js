import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  attempted: false,
  selecting: false,
  rooting: false,
  success: false,
};

export const rootSlice = createSlice({
  name: "root",
  initialState,
  reducers: {
    selecting: (state) => {
      state.selecting = true;
    },
    root: (state) => {
      state.selecting = false;
      state.attempted = true;
      state.rooting = true;
      state.success = false;
    },
    success: (state) => {
      state.selecting = false;
      state.rooting = false;
      state.success = true;
    },
    fail: (state) => {
      state.selecting = false;
      state.rooting = false;
      state.success = false;
    },
    reset: () => initialState,
  },
});

export const {
  fail,
  reset,
  root,
  selecting,
  success,
} = rootSlice.actions;

export const selectAttempted = (state) => state.root.attempted;
export const selectRooting = (state) => state.root.rooting;
export const selectSelecting = (state) => state.root.selecting;
export const selectSuccess = (state) => state.root.success;

export default rootSlice.reducer;
