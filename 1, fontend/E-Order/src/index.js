import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from "react-redux";
import { rootStore } from "./reducer";
import { resolveApiBase } from "./utils/apiResolver";

// ─── Fast-Failover Bootstrap ────────────────────────────────────────────────
// Resolve the healthiest backend IP BEFORE rendering React.
// This bypasses the 18s OS TCP timeout caused by multiple DNS A-records.
// See: 3. knowledge/architecture/infrastructure_analysis_dns_timeout.md
resolveApiBase().then(() => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
        <Provider store={rootStore}>
            <BrowserRouter>
                <ChakraProvider>
                    <App />
                </ChakraProvider>
            </BrowserRouter>
        </Provider>
    );
    reportWebVitals();
});




