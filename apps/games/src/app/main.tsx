import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@app/styles/index.css";
import { App } from "@app/app";
import { startProgressSync } from "@features/sync";

const rootElement = document.querySelector<HTMLDivElement>("#app");

if (!rootElement) {
  throw new Error("App root was not found");
}

// Guest-first: this only checks for a session and syncs in the background.
// Without a session or network every game keeps working from localStorage.
startProgressSync();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
