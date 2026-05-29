// Polyfill Buffer for the browser before any Solana code loads.
// @solana/web3.js uses Node's `Buffer` global (for base58 encoding,
// transaction serialization, etc.). Next.js polyfills this automatically;
// Vite does not — so without this line, anything that touches Solana
// (e.g. CCTP cross-ecosystem bridges) throws "Buffer is not defined".
import { Buffer } from "buffer";
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}

import React from "react";
import ReactDOM from "react-dom/client";
import "@usewhisk/react/styles.css";
import "./styles.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
