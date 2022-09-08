import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  checks: [],
  passed: false,
  installed: false,
  processing: false,
  failed: false,
};

export const installHealthchecks = createAsyncThunk(
  "healthcheck/installHealthchecks",
  async ({
    adb,
    log,
    done,
  }) => {
    await adb.installHealthchecks(log, done);
  }
);

export const runHealthcheckUnits = createAsyncThunk(
  "healthcheck/runHealthcheckUnits",
  async ({
    adb,
    log,
  }) => {
    return await adb.runHealthcheckUnits(log);
  }
);

export const runHealthcheckFix = createAsyncThunk(
  "healthcheck/runHealthcheckFix",
  async ({
    adb,
    path,
    log,
    done,
  }) => {
    await adb.runHealthcheckFix(path, log, done);
  }
);

const checkPassed = (state) => {
};

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
        state.installed = true;
        //state.processing = false;
      })
      .addCase(runHealthcheckUnits.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(runHealthcheckUnits.fulfilled, (state, action) => {
        state.checks = action.payload || [];
        state.processing = false;

        if(state.checks.length < 1) {
          state.failed = true;
        }
        checkPassed(state);
      })
      .addCase(runHealthcheckFix.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(runHealthcheckFix.fulfilled, (state, action) => {
        //state.processing = false;
      });
  },
});

export const { reset } = healthcheckSlice.actions;

export const selectChecks = (state) => state.healthcheck.checks;
export const selectPassed = (state) => state.healthcheck.passed;
export const selectInstalled = (state) => state.healthcheck.installed;
export const selectProcessing = (state) => state.healthcheck.processing;
export const selectError = (state) => state.healthcheck.error;
export const selectFailed = (state) => state.healthcheck.failed;

export default healthcheckSlice.reducer;
