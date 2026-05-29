// Polyfill Buffer for the browser before any wallet code loads.
// Some wallet SDKs (and any Solana chain you add later) reach for Node's
// `Buffer` global, which Vite does not provide. Next.js polyfills it
// automatically; in a Vite app this one-liner prevents "Buffer is not
// defined". This recipe is EVM-only today, so it's defensive — but it
// costs nothing and removes the footgun if a Solana chain is added.
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
