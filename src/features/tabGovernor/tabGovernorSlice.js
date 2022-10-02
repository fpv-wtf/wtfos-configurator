import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isMaster: true,
  checkedMaster: false,
};

export const tabGovernorSlice = createSlice({
  name: "tabGovernor",
  initialState,
  reducers: {
    setMaster: (state, action) => {
      state.isMaster = action.payload;
    },
    checkedMaster: (state, action) => {
      state.checkedMaster = true;
    },
  },
});

export const {
  checkedMaster,
  setMaster,
} = tabGovernorSlice.actions;

export const selectIsMaster = (state) => state.tabGovernor.isMaster;
export const selectCheckedMaster = (state) => state.tabGovernor.checkedMaster;

export default tabGovernorSlice.reducer;
