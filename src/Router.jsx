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

import Footer from "./features/navigation/Footer";
import Root from "./features/root/Root";

import AdbRouter from "./AdbRouter";
import TabGovernor from "./utils/TabGovernor";

import {
  checkedMaster,
  setMaster,
} from "./features/tabGovernor/tabGovernorSlice";

export default function Router() {
  const dispatch = useDispatch();

  const [tabGovernor, setTabGovernor] = useState(null);

  useEffect(() => {
    if(!tabGovernor) {
      const tabGovernor = new TabGovernor((isMaster) => {
        dispatch(setMaster(isMaster));
        dispatch(checkedMaster(true));
      });
      tabGovernor.connect();
      setTabGovernor(tabGovernor);
    }
  }, [tabGovernor, setMaster, , setTabGovernor]);

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
