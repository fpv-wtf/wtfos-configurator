import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { AdbSyncStatErrorCode } from "@yume-chan/adb";

const initialState = {
  checks: [],
  passed: false,
  installed: false,
  processing: false,
  error: [],
};

export const installHealthchecks = createAsyncThunk(
  "healthcheck/installHealthchecks",
  async ({
    adb,
    callback,
  }) => {
    const checks = await adb.installHealthchecks(callback);
    return checks;
  }
);

export const healthcheckSlice = createSlice({
  name: "healthcheck",
  initialState,
  reducers: { reset: () => initialState },
  extraReducers: (builder) => {
    builder
      .addCase(installHealthchecks.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(installHealthchecks.fulfilled, (state, action) => {
        state.checks = action.payload;
        state.installed = true;
        state.processing = false;
      });
  },
});

export const { reset } = healthcheckSlice.actions;

export const selectChecks = (state) => state.healthcheck.checks;
export const selectPassed = (state) => state.healthcheck.passed;
export const selectInstalled = (state) => state.healthcheck.installed;
export const selectProcessing = (state) => state.healthcheck.processing;
export const selectError = (state) => state.healthcheck.error;

export default healthcheckSlice.reducer;
