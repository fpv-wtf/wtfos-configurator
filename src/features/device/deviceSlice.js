import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  error: false,
  status: "idle",
  hasHttpProxy: false,
};

export const deviceSlice = createSlice({
  name: "device",
  initialState,
  reducers: {
    disconnected: (state) => {
      state.status = "idle";
      state.connected = false;
    },
    connected: (state) => {
      state.status = "connected";
      state.connected = true;
    },
    connecting: (state) => {
      state.error = false;
      state.status = "selecting";
    },
    connectionFailed: (state) => {
      state.error = true;
      state.status = "idle";
    },
  },
});

export const {
  connected,
  connecting,
  connectionFailed,
  disconnected,
} = deviceSlice.actions;

export const selectConnected = (state) => state.device.connected;
export const selectError = (state) => state.device.error;
export const selectHasHttpProxy = (state) => state.device.hasHttpProxy;
export const selectStatus = (state) => state.device.status;

export default deviceSlice.reducer;
