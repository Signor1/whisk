"use client";

import { Providers } from "./providers";
import { ExampleWidget } from "./widget";

/**
 * Composes the Whisk providers + widget under a single client boundary.
 * Loaded via `next/dynamic` with `ssr: false` from `page.tsx` — wagmi
 * touches IndexedDB at module-init time, so we keep the entire wallet
 * stack out of the server bundle.
 */
export function ExampleClient() {
  return (
    <Providers>
      <ExampleWidget />
    </Providers>
  );
}
