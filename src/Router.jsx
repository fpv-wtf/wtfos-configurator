import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import AdbRouter from "./AdbRouter";
import Root from "./features/root/Root";

export default function Router() {
  return(
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
  );
}
