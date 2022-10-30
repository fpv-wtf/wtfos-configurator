import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  canClaim: true,
  claimed: false,
  checked: false,
  isMaster: true,
};

export const tabGovernorSlice = createSlice({
  name: "tabGovernor",
  initialState,
  reducers: {
    setMaster: (state, action) => {
      state.isMaster = action.payload;
    },
    setCanClaim: (state, action) => {
      state.canClaim = action.payload;
    },
    setClaimed: (state, action) => {
      state.claimed = action.payload;
    },
    setChecked: (state, action) => {
      state.checked = true;
    },
  },
});

export const {
  setChecked,
  setCanClaim,
  setClaimed,
  setMaster,
} = tabGovernorSlice.actions;

export const selectIsMaster = (state) => state.tabGovernor.isMaster;
export const selectCanClaim = (state) => state.tabGovernor.canClaim;
export const selectChecked = (state) => state.tabGovernor.checked;
export const selectClaimed = (state) => state.tabGovernor.claimed;

export default tabGovernorSlice.reducer;
