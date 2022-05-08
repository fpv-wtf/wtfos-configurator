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
  }) => {
    try {
      const output = await adb.installPackage(name);

      if(output.exitCode === 0) {
        return name;
      }
    } catch(e) {
      console.log(e);
    }
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
        const name = action.payload;
        state.packages = state.packages.map((item) => {
          if(item.name === name) {
            item.installed = false;
          }

          return item;
        });
        state.filtered = filterPackages(state.packages, state.filter);
        state.processing = false;
      })
      .addCase(installPackage.pending, (state, action) => {
        state.processing = true;
      })
      .addCase(installPackage.fulfilled, (state, action) => {
        const name = action.payload;
        state.packages = state.packages.map((item) => {
          if(item.name === name) {
            item.installed = true;
          }

          return item;
        });
        state.filtered = filterPackages(state.packages, state.filter);
        state.processing = false;
      })
      .addCase(fetchUpgradable.pending, (state, action) => {
        state.processing = true;
        state.fetchedUpgradable = true;
      })
      .addCase(fetchUpgradable.fulfilled, (state, action) => {
        state.upgradable = action.payload;
        state.processing = false;
      })
      .addCase(upgrade.pending, (state, action) => {
        state.processing = true;
        state.fetchedUpgradable = false;
      })
      .addCase(upgrade.fulfilled, (state, action) => {
        state.processing = false;
      });
  },
});

export const {
  installedFilter,
  processing,
  repo,
  search,
} = packagesSlice.actions;

export const selectRepos = (state) => state.packages.repos;
export const selectFetched = (state) => state.packages.fetched;
export const selectFetchedUpgradable = (state) => state.packages.fetchedUpgradable;
export const selectFilter = (state) => state.packages.filter;
export const selectFiltered = (state) => state.packages.filtered;
export const selectProcessing = (state) => state.packages.processing;
export const selectUpgradable = (state) => state.packages.upgradable;

export default packagesSlice.reducer;
