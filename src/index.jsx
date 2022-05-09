import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import {
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";
import Box from "@mui/material/Box";

import { store } from "./app/store";
import Router from "./Router";
import reportWebVitals from "./reportWebVitals";

import "./index.css";


const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1676c7" },
    secondary: { main: "#5b5bb9" },
    background: {
      default: "#12121c",
      paper: "#242539",
    },
    success: { main: "#419ef9" },
    error: { main: "#e23860" },
  },
});

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <Provider store={store}>
      <ThemeProvider theme={darkTheme}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            minHeight: "100%",
            color: "text.primary",
          }}
        >
          <Router />
        </Box>
      </ThemeProvider>
    </Provider>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
