"use client";

import dynamic from "next/dynamic";

/**
 * Client-side gate that lazy-loads the wallet stack with `ssr: false`.
 *
 * Why this exists: Next.js 15 disallows `ssr: false` inside server
 * components. So `page.tsx` (a server component) renders this gate,
 * which is itself a client component, which then dynamically imports
 * the actual provider tree. The end result is identical to calling
 * `dynamic(...)` directly from `page.tsx` would have been: wagmi /
 * WalletConnect / IndexedDB-touching code never runs on the server.
 */
const ExampleClient = dynamic(
  () => import("./client").then((m) => ({ default: m.ExampleClient })),
  { ssr: false },
);

export function ClientGate() {
  return <ExampleClient />;
}
