// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css"; // Ensure Tailwind is imported

const root = document.getElementById("root");

if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}


