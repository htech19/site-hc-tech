import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Anti-clickjacking (frame-buster) — fallback p/ ambientes sem header HTTP.
// Desativado em dev e em hosts de preview (Lovable) para não quebrar o iframe.
const isPreviewHost =
  import.meta.env.DEV ||
  /(^|\.)lovable\.(app|dev)$/.test(window.location.hostname) ||
  window.location.hostname === "localhost";

if (!isPreviewHost && window.top !== window.self) {
  try {
    window.top!.location.href = window.self.location.href;
  } catch {
    document.body.style.display = "none";
  }
}


createRoot(document.getElementById("root")!).render(<App />);
