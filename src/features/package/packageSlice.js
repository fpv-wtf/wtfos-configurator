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
  installedVersion: null,
  details: {
    homepage: null,
    maintainer: null,
  },

  schema: null,
  config: null,

  writing: false,
  error: null,
  errors: { fetchPackage: false },
};

export const fetchPackage = createAsyncThunk(
  "package/fetchPackage",
  async ({
    adb,
    name,
  }) => {
    const packageDetails = await adb.getPackageDetails(name);

    if(!packageDetails) {
      throw new Error("Could not find package details - please try reloading.");
    }

    return packageDetails;
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
    units,
  }, thunk) => {
    const name = thunk.getState().package.name;
    const stringified = JSON.stringify(config, null, "  ");
    await adb.writePackageConfig(name, stringified, units);

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
        state.errors = initialState.errors;
        state.loading = true;
      })
      .addCase(fetchPackage.rejected, (state, action) => {
        state.errors.fetchPackage = true;
        state.error = action.error.message;
        state.loading = false;
        state.fetched = true;
      })
      .addCase(fetchPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.fetched = true;

        state.name = action.payload.name;
        state.description = action.payload.description;
        state.installed = action.payload.installed;
        state.installedVersion = action.payload.installedVersion;

        state.details = {
          ...state.details,
          ...action.payload.details,
        };
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
export const selectInstalledVersion = (state) => state.package.installedVersion;
export const selectDetails = (state) => state.package.details;

export const selectWriting = (state) => state.package.writing;
export const selectError = (state) => state.package.error;
export const selectErrors = (state) => state.package.errors;
export const selectLoading = (state) => state.package.loading;

export const selectConfig = (state) => state.package.config;
export const selectSchema = (state) => state.package.schema;

export default packageSlice.reducer;
