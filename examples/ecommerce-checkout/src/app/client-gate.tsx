"use client";

import dynamic from "next/dynamic";

const ExampleCheckout = dynamic(
  () => import("./checkout").then((m) => ({ default: m.ExampleCheckout })),
  { ssr: false },
);

const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false },
);

export function ClientGate() {
  return (
    <Providers>
      <ExampleCheckout />
    </Providers>
  );
}
