import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  loading: true,
  fetched: false,

  name: null,
  description: null,
  installed: false,

  schema: null,
  config: null,

  writing: false,
  error: null,
};

export const fetchPackage = createAsyncThunk(
  "package/fetchPackage",
  async ({
    adb,
    name,
  }) => {
    return adb.getPackageDetails(name);
  }
);

export const fetchConfig = createAsyncThunk(
  "package/fetchConfig",
  async (adb, thunk) => {
    const name = thunk.getState().package.name;
    return adb.getPackageConfig(name);
  }
);

export const writeConfig = createAsyncThunk(
  "package/writeConfig",
  async ({
    adb,
    config,
  }, thunk) => {
    const name = thunk.getState().package.name;
    const stringified = JSON.stringify(config, null, "  ");
    await adb.writePackageConfig(name, stringified);

    return config;
  }
);

export const packageSlice = createSlice({
  name: "package",
  initialState,
  reducers: { reset: () => initialState },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.fetched = true;

        state.name = action.payload.name;
        state.description = action.payload.description;
        state.installed = action.payload.installed;
      }).addCase(fetchConfig.pending, (state, action) => {
        state.config = null;
        state.schema = null;
      }).addCase(fetchConfig.fulfilled, (state, action) => {
        state.config = action.payload.config;
        state.schema = action.payload.schema;
      }).addCase(writeConfig.pending, (state, action) => {
        state.writing = true;
      }).addCase(writeConfig.fulfilled, (state, action) => {
        state.config = action.payload;
        state.writing = false;
      }).addCase(writeConfig.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },

});

export const { reset } = packageSlice.actions;

export const selectFetched = (state) => state.package.fetched;

export const selectName = (state) => state.package.name;
export const selectDescription = (state) => state.package.description;
export const selectInstalled = (state) => state.package.installed;

export const selectWriting = (state) => state.package.writing;
export const selectError = (state) => state.package.error;
export const selectLoading = (state) => state.package.loading;

export const selectConfig = (state) => state.package.config;
export const selectSchema = (state) => state.package.schema;

export default packageSlice.reducer;
