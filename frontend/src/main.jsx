import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { App as AntdApp } from "antd";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AntdApp
      message={{
        top: 80,
        duration: 3,
        maxCount: 3,
      }}
    >
      <App />
    </AntdApp>
  </StrictMode>
);