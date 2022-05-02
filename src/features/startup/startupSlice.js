import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  services: [],
  fetched: false,
  processing: true,
  error: null,
};

export const fetchServices = createAsyncThunk(
  "startup/fetchServices",
  async (adb, { rejectWithValue }) => {
    let services = [];
    try {
      services = await adb.getServices();
    } catch(e) {
      console.log(e);
      return rejectWithValue(e.toString());
    }

    return services;
  }
);

export const disableService = createAsyncThunk(
  "startup/disableService",
  async ({
    adb,
    name,
  }, { rejectWithValue }) => {
    let services = [];
    try {
      await adb.disableService(name);
      services = await adb.getServices();
    } catch(e) {
      console.log(e);
      return rejectWithValue(e.toString());
    }

    return services;
  }
);

export const enableService = createAsyncThunk(
  "startup/enableService",
  async ({
    adb,
    name ,
  }, { rejectWithValue }) => {
    let services = [];
    try {
      await adb.enableService(name);
      services = await adb.getServices();
    } catch(e) {
      console.log(e);
      return rejectWithValue(e.toString());
    }

    return services;
  }
);

export const startupSlice = createSlice({
  name: "startup",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state, action) => {
        state.error = null;
        state.processing = true;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.services = action.payload;
        state.processing = false;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.error = action.payload;
        state.processing = false;
      })
      .addCase(enableService.pending, (state, action) => {
        state.error = null;
        state.processing = true;
      })
      .addCase(enableService.fulfilled, (state, action) => {
        state.services = action.payload;
        state.processing = false;
      })
      .addCase(enableService.rejected, (state, action) => {
        state.error = action.payload;
        state.processing = false;
      })
      .addCase(disableService.pending, (state, action) => {
        state.error = null;
        state.processing = true;
      })
      .addCase(disableService.fulfilled, (state, action) => {
        state.services = action.payload;
        state.processing = false;
      })
      .addCase(disableService.rejected, (state, action) => {
        state.error = action.payload;
        state.processing = false;
      });
  },
});

export const selectError = (state) => state.startup.error;
export const selectFetched = (state) => state.startup.fetched;
export const selectProcessing = (state) => state.startup.processing;
export const selectServices = (state) => state.startup.services;

export default startupSlice.reducer;
