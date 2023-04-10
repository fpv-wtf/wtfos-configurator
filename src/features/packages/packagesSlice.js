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
    repo: "fpv-wtf",
    search: null,
    system: false,
  },
  fetched: false,
  fetchedUpgradable: false,
  processing: false,
  error: [],
  errors: {
    fetchPackages: false,
    fetchUpgradable: false,
    installPackage: false,
    removePackage: false,
  },
  update: {
    ran: false,
    success: false,
  },
};

export const removePackage = createAsyncThunk(
  "packages/removePackage",
  async ({
    adb,
    name,
  }, { rejectWithValue }) => {
    let errorMessage = ["Unknown error while removing package..."];
    try {
      const output = await adb.removePackage(name);

      if(output.exitCode === 0) {
        return name;
      }

      errorMessage = output.stdout.split("\n");
    } catch(e) {
      if(e.stdout) {
        errorMessage = e.stdout.split("\n");
      }
    }

    return rejectWithValue(errorMessage);
  }
);

export const installPackage = createAsyncThunk(
  "packages/installPackage",
  async ({
    adb,
    name,
  }, { rejectWithValue }) => {
    let errorMessage = ["Unknown error while installing package"];
    try {
      const output = await adb.installPackage(name);

      if(output.exitCode === 0) {
        return name;
      }

      errorMessage = output.stdout.split("\n");
    } catch(e) {
      if(e.stdout) {
        errorMessage = e.stdout.split("\n");
      }
    }

    return rejectWithValue(errorMessage);
  }
);

export const fetchPackages = createAsyncThunk(
  "packages/fetchPackages",
  async (adb, { rejectWithValue }) => {
    let errorMessage = ["Unknown error while fetching packages..."];
    let packages = [];
    let repos = [];

    try {
      packages = await adb.getPackages();
      repos =  await adb.getRepos();

      return {
        packages,
        repos,
      };
    } catch(e) {
      if(e.stdout) {
        errorMessage = e.stdout.split("\n");
      }
    }

    return rejectWithValue(errorMessage);
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
  async ({
    adb,
    callback,
  }) => {
    await adb.upgradePackages(callback);
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
    (filter.repo === "all" || filter.search) ||
    (filter.repo === item.repo && !filter.search)
  ));

  // Remove system packages
  if(!filter.system) {
    filtered = filtered.filter((item) => (
      !(item.details.section && item.details.section.includes("system"))
    ));
  }

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
    systemFilter: (state, event) => {
      state.filter = {
        ...state.filter,
        system: event.payload,
      };

      state.filtered = filterPackages(state.packages, state.filter);
    },
    processing: (state, event) => {
      state.processing = event.payload;
    },
    clearError: (state, event) => {
      state.error = initialState.error;
      state.errors = initialState.errors;
    },
    reset: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPackages.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(fetchPackages.rejected, (state, action) => {
        console.log("fetch package rejeced", action);
        state.error = action.payload;

        state.errors.fetchPackages = true;
        state.fetched = true;
        state.processing = false;
      })
      .addCase(fetchPackages.fulfilled, (state, action) => {
        state.packages = action.payload.packages;
        state.repos = action.payload.repos;

        state.errors.fetchPackages = false;
        state.filtered = filterPackages(state.packages, state.filter);
        state.fetched = true;
        state.processing = false;
      })
      .addCase(removePackage.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(removePackage.rejected, (state, action) => {
        state.error = action.payload;

        state.errors.removePackage = true;
        state.processing = false;
        state.fetched = false;
      })
      .addCase(removePackage.fulfilled, (state, action) => {
        state.error = initialState.error;
        state.errors = initialState.errors;

        state.fetched = false;
        state.processing = false;
      })
      .addCase(installPackage.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(installPackage.rejected, (state, action) => {
        state.error = action.payload;

        state.errors.installPackage = true;
        state.processing = false;
        state.fetched = false;
      })
      .addCase(installPackage.fulfilled, (state, action) => {
        state.error = initialState.error;
        state.errors = initialState.errors;

        state.fetched = false;
        state.processing = false;
      })
      .addCase(fetchUpgradable.pending, (state, action) => {
        state.processing = true;
        state.fetchedUpgradable = false;
      })
      .addCase(fetchUpgradable.rejected, (state, action) => {
        state.error = action.payload;

        state.errors.fetchUpgradable = true;
        state.fetchedUpgradable = true;
        state.processing = false;
      })
      .addCase(fetchUpgradable.fulfilled, (state, action) => {
        state.upgradable = action.payload;

        state.errors.fetchUpgradable = false;
        state.processing = false;
        state.fetchedUpgradable = true;
      })
      .addCase(upgrade.pending, (state, action) => {
        state.processing = true;
        state.fetchedUpgradable = false;
        state.update.ran = false;
      })
      .addCase(upgrade.rejected, (state, action) => {
        state.processing = false;
        state.update.ran = true;
        state.update.success = false;
      })
      .addCase(upgrade.fulfilled, (state, action) => {
        state.processing = false;
        state.update.ran = true;
        state.update.success = true;
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
  systemFilter,
} = packagesSlice.actions;

export const selectRepos = (state) => state.packages.repos;
export const selectError = (state) => state.packages.error;
export const selectErrors = (state) => state.packages.errors;
export const selectFetched = (state) => state.packages.fetched;
export const selectFetchedUpgradable = (state) => state.packages.fetchedUpgradable;
export const selectFilter = (state) => state.packages.filter;
export const selectFiltered = (state) => state.packages.filtered;
export const selectProcessing = (state) => state.packages.processing;
export const selectUpgradable = (state) => state.packages.upgradable;
export const selectUpdate = (state) => state.packages.update;

export default packagesSlice.reducer;
