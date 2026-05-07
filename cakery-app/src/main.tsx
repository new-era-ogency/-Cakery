import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

console.info("Cakery-Engine-V1.0.5-Deployed");

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("#root missing in index.html");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
