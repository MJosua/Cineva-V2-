import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./Router";
import { resolveApiBase } from "./utils/apiResolver";

// ─── Fast-Failover Bootstrap ────────────────────────────────────────────────
// Resolve the healthiest backend IP BEFORE rendering React.
// This bypasses the 18s OS TCP timeout caused by multiple DNS A-records.
// See: 3. knowledge/architecture/infrastructure_analysis_dns_timeout.md
resolveApiBase().then(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>
  );
});
