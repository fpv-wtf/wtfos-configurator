import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";

const initialState = {
  repos: [],
  packages: [],
  filtered: [],
  upgradable: [],
  filter: {
    installed: false,
    search: null,
    repo: "fpv-wtf",
  },
  fetched: false,
  fetchedUpgradable: false,
  processing: false,
  error: [],
};

export const removePackage = createAsyncThunk(
  "packages/removePackage",
  async ({
    adb,
    name,
  }) => {
    try {
      const output = await adb.removePackage(name);

      if(output.exitCode === 0) {
        return name;
      }
    } catch(e) {
      console.log(e);
    }
  }
);

export const installPackage = createAsyncThunk(
  "packages/installPackage",
  async ({
    adb,
    name,
  }, { rejectWithValue }) => {
    let output = ["ERROR: Unknown error during installation."];
    try {
      output = await adb.installPackage(name);

      if(output.exitCode === 0) {
        return name;
      }
    } catch(e) {
      console.log(e);
    }

    if(output.stdout) {
      output = output.stdout.split("\n");
    }

    return rejectWithValue(output);
  }
);

export const fetchPackages = createAsyncThunk(
  "packages/fetchPackages",
  async (adb) => {
    let packages = [];
    let repos = [];
    try {
      packages = await adb.getPackages();
      repos =  await adb.getRepos();
    } catch(e) {
      console.log(e);
    }

    return {
      packages,
      repos,
    };
  }
);

export const fetchUpgradable = createAsyncThunk(
  "packages/fetchUpgradable",
  async (adb) => {
    const upgradable = await adb.getUpgradablePackages();

    return upgradable;
  }
);

export const upgrade = createAsyncThunk(
  "packages/upgrade",
  async (adb) => {
    await adb.upgradePackages();
  }
);

export const installWTFOS = createAsyncThunk(
  "packages/installWTFOS",
  async ({
    adb,
    callback,
    setRebooting,
  }) => {
    await adb.installWTFOS(callback, setRebooting);
  }
);

export const removeWTFOS = createAsyncThunk(
  "packages/removeWTFOS",
  async ({
    adb,
    callback,
    setRebooting,
  }) => {
    await adb.removeWTFOS(callback, setRebooting);
  }
);

function filterPackages(packages, filter) {
  let filtered = packages.filter((item) => (
    filter.repo === "all" ||
    filter.repo === item.repo
  ));

  filtered = filtered.filter((item) => {
    if(filter.installed) {
      return item.installed;
    }

    return true;
  });

  if(filter.search) {
    filtered = filtered.filter((item) => {
      return item.name.includes(filter.search) ||
        item.description.includes(filter.search);
    });
  }

  return filtered;
}

export const packagesSlice = createSlice({
  name: "packageManager",
  initialState,
  reducers: {
    page: (state, event) => {
      state.page = event.payload;
    },
    installedFilter: (state, event) => {
      state.filter = {
        ...state.filter,
        installed: event.payload,
      };

      state.filtered = filterPackages(state.packages, state.filter);
    },
    search: (state, event) => {
      state.filter = {
        ...state.filter,
        search: event.payload,
      };

      state.filtered = filterPackages(state.packages, state.filter);
    },
    repo: (state, event) => {
      state.filter = {
        ...state.filter,
        repo: event.payload,
      };

      state.filtered = filterPackages(state.packages, state.filter);
    },
    processing: (state, event) => {
      state.processing = event.payload;
    },
    reset: (state, event) => {
      state = initialState;
    },
    clearError: (state, event) => {
      state.error = initialState.error;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackages.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.packages = action.payload.packages;
        state.repos = action.payload.repos;
        state.filtered = filterPackages(state.packages, state.filter);
        state.fetched = true;
        state.processing = false;
      })
      .addCase(removePackage.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(removePackage.fulfilled, (state, action) => {
        state.fetched = false;
        state.processing = false;
      })
      .addCase(installPackage.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(installPackage.fulfilled, (state, action) => {
        state.fetched = false;
        state.processing = false;
      })
      .addCase(installPackage.rejected, (state, action) => {
        state.error = action.payload;
        state.processing = false;
        state.fetched = false;
      })
      .addCase(fetchUpgradable.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(fetchUpgradable.fulfilled, (state, action) => {
        state.fetchedUpgradable = true;
        state.upgradable = action.payload;
        state.processing = false;
      })
      .addCase(upgrade.pending, (state, action) => {
        state.processing = true;
        state.fetchedUpgradable = false;
      })
      .addCase(upgrade.fulfilled, (state, action) => {
        state.processing = false;
      })
      .addCase(installWTFOS.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(installWTFOS.fulfilled, (state, action) => {
        state.processing = false;
      })
      .addCase(removeWTFOS.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(removeWTFOS.fulfilled, (state, action) => {
        state.processing = false;
      });
  },
});

export const {
  clearError,
  installedFilter,
  processing,
  repo,
  reset,
  search,
} = packagesSlice.actions;

export const selectRepos = (state) => state.packages.repos;
export const selectError = (state) => state.packages.error;
export const selectFetched = (state) => state.packages.fetched;
export const selectFetchedUpgradable = (state) => state.packages.fetchedUpgradable;
export const selectFilter = (state) => state.packages.filter;
export const selectFiltered = (state) => state.packages.filtered;
export const selectProcessing = (state) => state.packages.processing;
export const selectUpgradable = (state) => state.packages.upgradable;

export default packagesSlice.reducer;
