import React from "react";
import {
  Routes,
  Route,
} from "react-router-dom";

import Stack from "@mui/material/Stack";

import AdbRouter from "./AdbRouter";
import Footer from "./features/navigation/Footer";
import Root from "./features/root/Root";


export default function Router() {
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
