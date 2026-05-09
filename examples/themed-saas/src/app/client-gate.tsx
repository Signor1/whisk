"use client";

import dynamic from "next/dynamic";

const Dashboard = dynamic(
  () => import("./dashboard").then((m) => ({ default: m.Dashboard })),
  { ssr: false },
);

const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false },
);

export function ClientGate() {
  return (
    <Providers>
      <Dashboard />
    </Providers>
  );
}
