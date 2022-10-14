import React from "react";
import ReactDOM from "react-dom";
import Site from "./components/Site.js";
import './assets/css/style.css';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: "#989898"
    },
    secondary: {
      main: "#ffffff"
    }
  }
});

ReactDOM.render(
  <ThemeProvider theme={theme}>
    <Site />
  </ThemeProvider>,
  document.getElementById('root')
);
