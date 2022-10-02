import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  connected: false,
  hasAdb: false,
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
  temperature: null,
  device: null,
  productType:null,
  niceName: null,
  claimed: false,
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
    setLog: (state, action) => {
      state.log = action.payload;
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
    setAdb: (state, action) => {
      state.hasAdb = action.payload;
    },
    setTemperature: (state, action) => {
      state.temperature = action.payload;
    },
    setProductInfo: (state, action) => {
      const {
        device,
        productType,
      } = action.payload;
      state.device = device;
      state.productType = productType;

      switch(device) {
        case "pigeon_wm150_gls": {
          state.niceName = "DJI FPV Goggles V1";
        } break;

        case "pigeon_wm170_gls": {
          state.niceName = "DJI FPV Goggles V2 (FPV Mode)";

          if(productType === "wm150_gls") {
            state.niceName = "DJI FPV Goggles V2 (DIY Mode)";
          }
        } break;

        case "pigeon_wm150": {
          state.niceName = "DJI FPV Air Unit";
        } break;

        case "pigeon_wm150_tiny": {
          state.niceName = "DJI FPV Air Unit Light (Caddx Vista)";
        } break;

        default: {
          state.niceName = "Unknown";
        }
      }
    },
    setClaimed: (state, action) => {
      state.claimed = action.payload;
    },
    contextReset: (state) => {
      state.checked = false;
      state.temperature = null;
    },
    reset: () => initialState,
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
  contextReset,
  disconnected,
  installing,
  rebooting,
  reset,
  setAdb,
  setClaimed,
  setLog,
  setProductInfo,
  setTemperature,
} = deviceSlice.actions;

export const selectHasAdb = (state) => state.device.hasAdb;
export const selectChecked = (state) => state.device.checked;
export const selectClaimed = (state) => state.device.claimed;
export const selectConnected = (state) => state.device.connected;
export const selectError = (state) => state.device.error;
export const selectHasHttpProxy = (state) => state.device.hasHttpProxy;
export const selectHasDinitBinary = (state) => state.device.binaries.hasDinitBinary;
export const selectHasOpkgBinary = (state) => state.device.binaries.hasOpkgBinary;
export const selectLog = (state) => state.device.log;
export const selectNiceName = (state) => state.device.niceName;
export const selectRebooting = (state) => state.device.rebooting;
export const selectStatus = (state) => state.device.status;
export const selectTemperature = (state) => state.device.temperature;

export default deviceSlice.reducer;
