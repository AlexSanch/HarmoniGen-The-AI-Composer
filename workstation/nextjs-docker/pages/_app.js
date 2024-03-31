import React from "react";
import "../styles/globals.css";
import { Toaster } from "react-hot-toast";

function MyApp({ Component, pageProps }) {
  return (
    <React.Fragment>
      <Toaster position="bottom-center" />
      <Component {...pageProps} />
    </React.Fragment>
  );
}

export default MyApp;
