import { createSlice } from "@reduxjs/toolkit";

import { loadDonationState } from "../../utils/LocalStorage";

const initialState = { donateState: loadDonationState() };

export const donateSlice = createSlice({
  name: "donate",
  initialState,
  reducers: {
    reset: () => initialState,
    setDonationState: (state, action) => {
      state.donateState = true;
      localStorage.setItem("donationState", action.payload);
    },
  },
  extraReducers: (builder) => {},
});

export const {
  reset,
  setDonationState,
} = donateSlice.actions;

export const selectDonationState = (state) => state.donate.donateState;

export default donateSlice.reducer;
