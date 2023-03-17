import React,{
  useEffect,
  useState,
} from "react";
import {
  Routes,
  Route,
} from "react-router-dom";
import {
  useDispatch,
  useSelector,
} from "react-redux";

import Footer from "../navigation/Footer";
import Root from "../root/Root";

import AdbRouter from "./Adb";
import TabGovernor from "../../utils/TabGovernor";

import {
  setCanClaim,
  setChecked,
  setMaster,
} from "../tabGovernor/tabGovernorSlice";

import { selectClaimed } from "../device/deviceSlice";

export default function MainRouter() {
  const dispatch = useDispatch();

  const deviceClaimed = useSelector(selectClaimed);

  /**
   * Set up tab governor in most outer component to have it set up
   * for every following component and minimize re-evaluation.
   */
  const [tabGovernor, setTabGovernor] = useState(null);
  useEffect(() => {
    if(!tabGovernor) {
      const tabGovernor = new TabGovernor((isMaster) => {
        dispatch(setMaster(isMaster));
        dispatch(setChecked());
      }, (canClaim) => {
        dispatch(setCanClaim(canClaim));
      });
      tabGovernor.connect();
      setTabGovernor(tabGovernor);
    }
  }, [dispatch, tabGovernor, setTabGovernor]);

  // Notify others that we have claimed the device
  useEffect(() => {
    if(tabGovernor) {
      tabGovernor.deviceClaimed(deviceClaimed);
    }
  }, [tabGovernor, deviceClaimed]);

  return(
    <>
      <Routes>
        <Route
          element={<Root />}
          path="/root"
        />

        <Route
          element={<AdbRouter />}
          path="/*"
        />
      </Routes>

      <Footer />
    </>
  );
}
