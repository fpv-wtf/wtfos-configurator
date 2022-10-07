import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";


const initialState = {
  loading: true,
  fetched: false,
  repo: "fpv-wtf",
  package: null,
  details: [],
  configSchema: [],
  config: [],
  updates: false,
};


export const fetchPackage = createAsyncThunk(
  "package/fetchPackage",
  async ({
    adb, packageSlug, repo,
  }) => {
    let packages = {};

    try {
      packages = await adb.getPackages();
    } catch(e) {
      console.log(e);
    }
    return packages.find((p) => p.name === packageSlug && p.repo === repo);
  }
);

export const fetchConfig = createAsyncThunk(
  "package/fetchConfig",
  async (adb, thunk) => {
    const confString = await adb.readPackageConfig(thunk.getState().package.package);

    const conf = JSON.parse(confString);

    return conf;
  }
);


export const fetchConfigSchema = createAsyncThunk(
  "package/fetchConfigSchema",
  async (adb, thunk) => {
    const confString = await adb.readPackageConfigSchema(thunk.getState().package.package);

    const conf = JSON.parse(confString);

    return conf;
  }
);

export const packageSlice = createSlice({
  name: "package",
  initialState,
  reducers: {
    packageRepo: (state, action) => {
      state.repo = action.payload.repo;
      state.package = action.payload.packageSlug;
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackage.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPackage.fulfilled, (state, action) => {
        state.loading = false;
        state.fetched = true;
        state.details = action.payload;
      }).addCase(fetchConfig.fulfilled, (state, action) => {
        state.config = action.payload;
      }).addCase(fetchConfigSchema.fulfilled, (state, action) => {
        console.log(action.payload);
        state.configSchema = action.payload;
      });
  },

});

export const { packageRepo } = packageSlice.actions;

export const selectPackage = (state) => state.package.package;
export const selectRepo = (state) => state.package.repo;
export const selectDetails = (state) => state.package.details;
export const selectFetched = (state) => state.package.fetched;
export const selectConfig = (state) => state.package.config;
export const selectConfigSchema = (state) => state.package.configSchema;

export default packageSlice.reducer;
