import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  canClaim: true,
  claimed: false,
  checkedMaster: false,
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
    checkedMaster: (state, action) => {
      state.checkedMaster = true;
    },
  },
});

export const {
  checkedMaster,
  setCanClaim,
  setClaimed,
  setMaster,
} = tabGovernorSlice.actions;

export const selectIsMaster = (state) => state.tabGovernor.isMaster;
export const selectCanClaim = (state) => state.tabGovernor.canClaim;
export const selectCheckedMaster = (state) => state.tabGovernor.checkedMaster;
export const selectClaimed = (state) => state.tabGovernor.claimed;

export default tabGovernorSlice.reducer;
