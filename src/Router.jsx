import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import App from "./App";
import Root from "./features/root/Root";

export default function Router() {
  return(
    <Routes>
      <Route
        element={<Root />}
        path="/root"
      />

      <Route
        element={<App />}
        path="/*"
      />
    </Routes>
  );
}
