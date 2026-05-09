"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const Invoice = dynamic(
  () => import("./invoice").then((m) => ({ default: m.ExampleInvoice })),
  { ssr: false },
);

const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false },
);

export function ClientGate() {
  return (
    <Suspense fallback={null}>
      <Providers>
        <Invoice />
      </Providers>
    </Suspense>
  );
}
