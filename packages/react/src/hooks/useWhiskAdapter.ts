"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { WhiskAdapter } from "@strimz/whisk-core";

/**
 * Bridge wagmi's connected wallet into a `WhiskAdapter` the engine
 * understands.
 *
 * Implementation detail: wagmi exposes connector providers via
 * `connector.getProvider()` (an EIP-1193 provider). App Kit's
 * `createViemAdapterFromProvider` takes that provider and produces the
 * `Adapter` instance Whisk hands to `kit.send()` / `kit.bridge()`.
 *
 * The hook re-creates the adapter only when the underlying wagmi
 * connection actually changes. Account / chain switches surface as new
 * `WhiskAdapter` instances so the engine sees the right signer.
 */
export function useWhiskAdapter(): WhiskAdapter | null {
  const { address, connector, status } = useAccount();
  const [adapter, setAdapter] = useState<WhiskAdapter | null>(null);

  useEffect(() => {
    if (status !== "connected" || !connector || !address) {
      setAdapter(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const provider = await connector.getProvider();
        // The adapter factory accepts unknown EIP-1193 providers; wagmi's
        // `getProvider()` return type is `unknown` so the cast lives at
        // this boundary alone.
        const appKitAdapter = await createViemAdapterFromProvider({
          provider: provider as Parameters<
            typeof createViemAdapterFromProvider
          >[0]["provider"],
        });
        if (!cancelled) {
          setAdapter({
            appKitAdapter,
            kind: "evm",
            address,
          });
        }
      } catch {
        // Connector failed to expose a provider (rare — usually a
        // race during disconnect). Reset to null; the user will see the
        // disconnected UI, click connect, and we'll try again.
        if (!cancelled) setAdapter(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, connector, address]);

  return adapter;
}
