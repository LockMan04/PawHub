import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AmbientBackground } from "./components/AmbientBackground";
import "./styles/globals.css";

try {
  sessionStorage.removeItem("cat-scroll-v1-store");
  sessionStorage.removeItem("cat-scroll-v2-store");
  sessionStorage.removeItem("cat-scroll-v3-store");
  sessionStorage.removeItem("cat-scroll-v4-store");
} catch {
  // Ignore
}

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AmbientBackground />
      <div className="app-layer">
        <App />
      </div>
    </React.StrictMode>
  );
}
