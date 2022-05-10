import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  error: false,
  status: "idle",
  hasHttpProxy: false,
  binaries: {
    hasDinitBinary: false,
    hasOpkgBinary: false,
  },
  log: [],
  rebooting: false,
  checked: false,
};

export const checkBinaries = createAsyncThunk(
  "device/checkBinaries",
  async (adb) => {
    const hasDinitBinary = await adb.fileExists("/opt/sbin/dinit");
    const hasOpkgBinary = await adb.fileExists("/opt/bin/opkg");

    return {
      hasDinitBinary,
      hasOpkgBinary,
    };
  }
);

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

      if(state.rebooting) {
        state.rebooting = false;
        state.log = [...state.log, "Done!"];
      }
    },
    connecting: (state) => {
      state.error = false;
      state.status = "selecting";
    },
    connectionFailed: (state) => {
      state.error = true;
      state.status = "idle";
    },
    clearLog: (state) => {
      state.log = [];
    },
    appendToLog: (state, action) => {
      state.log = [...state.log, action.payload];
    },
    installing: (state) => {
      state.status = "installing";
    },
    rebooting: (state, action) => {
      state.rebooting = action.payload;
    },
    checked: (state, action) => {
      state.checked = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkBinaries.fulfilled, (state, action) => {
        state.binaries = action.payload;
      });
  },
});

export const {
  appendToLog,
  checked,
  clearLog,
  connected,
  connecting,
  connectionFailed,
  disconnected,
  installing,
  rebooting,
} = deviceSlice.actions;

export const selectChecked = (state) => state.device.checked;
export const selectConnected = (state) => state.device.connected;
export const selectError = (state) => state.device.error;
export const selectHasHttpProxy = (state) => state.device.hasHttpProxy;
export const selectHasDinitBinary = (state) => state.device.binaries.hasDinitBinary;
export const selectHasOpkgBinary = (state) => state.device.binaries.hasOpkgBinary;
export const selectLog = (state) => state.device.log;
export const selectRebooting = (state) => state.device.rebooting;
export const selectStatus = (state) => state.device.status;

export default deviceSlice.reducer;
