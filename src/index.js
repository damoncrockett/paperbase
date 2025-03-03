import React from "react";
import ReactDOM from "react-dom/client";
import Site from "./Site.js";
import './assets/css/style.css';
import './assets/css/landingStyle.css'
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: "#222222",
    },
    text: {
      primary: '#222222'    
    },
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <Site />
    </ThemeProvider>
  </React.StrictMode>
);

