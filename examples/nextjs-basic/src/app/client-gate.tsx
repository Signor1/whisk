"use client";

import dynamic from "next/dynamic";
import { installCircleCorsShim } from "./circle-cors-shim";

/**
 * Client-side gate that lazy-loads the playground with `ssr: false`.
 *
 * Why this exists: Next.js disallows `ssr: false` inside server
 * components. So `page.tsx` (server) renders this gate, which is a
 * client component, which dynamically imports the playground tree.
 * The wagmi + IndexedDB-touching code never runs on the server.
 *
 * We also install the Circle CORS shim here, at the module top
 * level, so it patches `window.fetch` before any App Kit code in the
 * dynamically-loaded playground chunk has a chance to fire its first
 * request.
 */
if (typeof window !== "undefined") {
  installCircleCorsShim();
}

const Playground = dynamic(
  () => import("./playground").then((m) => ({ default: m.Playground })),
  { ssr: false },
);

export function ClientGate() {
  return <Playground />;
}
