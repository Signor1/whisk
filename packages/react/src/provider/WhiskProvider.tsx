"use client";

import { useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type Config as WagmiConfig } from "wagmi";
import { createWhisk, ConfigError } from "@strimz/whisk-core";
import type { WhiskClientConfig } from "../config/types.js";
import { WhiskContext, type WhiskContextValue } from "./context.js";

export type WhiskProviderProps = {
  /** The frozen config from `createWhiskConfig(...)`. */
  config: WhiskClientConfig;
  /**
   * Theme mode. Defaults to following the host app — `"system"` reads the
   * `prefers-color-scheme` media query at first paint.
   */
  theme?: "light" | "dark" | "system";
  /**
   * Reuse a host-app QueryClient instead of letting Whisk create its own.
   * Pass your existing client when Whisk is mounted inside an app that
   * already runs `@tanstack/react-query`.
   */
  queryClient?: QueryClient;
  children: ReactNode;
};

/**
 * Mount Whisk's provider stack. From the inside out:
 *
 * 1. `WhiskContext` — exposes the engine + resolved config to hooks.
 * 2. `WagmiProvider` — only mounted when an `evm()` factory is in
 *    `config.wallets`. Apps that omit `evm()` don't pay for wagmi here.
 * 3. `QueryClientProvider` — wagmi v2 requires a TanStack Query client.
 *
 * The provider is the single attachment point — every Whisk component
 * (drop-in, modal, headless) renders inside this tree.
 */
export function WhiskProvider({
  config,
  theme = "system",
  queryClient: externalQueryClient,
  children,
}: WhiskProviderProps) {
  // Stable engine per provider mount. Re-creating the engine on every
  // render would discard App Kit's internal caches.
  const engine = useMemo(
    () =>
      createWhisk({
        chains: config.chains,
        defaultSourceChain: config.defaultSourceChain,
        defaultDestinationChain: config.defaultDestinationChain,
        token: config.token,
        resolver: config.resolver,
        feePolicy: config.feePolicy,
        rpcUrls: config.rpcUrls,
        useForwarder: config.useForwarder,
        appLabel: config.appLabel,
      }),
    // Engine config is meant to be static for the lifetime of the
    // provider. If a dev needs to swap chains they remount the provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const contextValue: WhiskContextValue = useMemo(
    () => ({ engine, config }),
    [engine, config],
  );

  // Surface unsupported wallet adapters at mount rather than at first
  // operation. The Solana factory is intentionally a stub in v0.1 — fail
  // loud rather than silently.
  const evmFactory = config.wallets.find((w) => w.kind === "evm");
  const solanaFactory = config.wallets.find((w) => w.kind === "solana");
  if (solanaFactory) {
    // Don't throw — the dev may have left it in for forward-compat. Warn
    // once at mount; the engine still works for any EVM chain in `chains`.
    if (typeof console !== "undefined") {
      console.warn(
        "[whisk] Solana wallet adapter is staged for v0.2; ignoring solana() factory for now.",
      );
    }
  }
  if (!evmFactory) {
    throw new ConfigError(
      "WhiskProvider: no supported wallet adapter present. Add evm() to config.wallets.",
    );
  }

  // wagmi config is opaque to the public type; the React layer narrows
  // it here at the boundary where it's consumed.
  const wagmiConfig = evmFactory.config as WagmiConfig;

  // Reuse the host's QueryClient when supplied; otherwise spin up an
  // isolated one whose lifetime tracks this provider mount.
  const queryClient = useMemo(
    () => externalQueryClient ?? new QueryClient(),
    [externalQueryClient],
  );

  // Compute theme attribute once. `data-whisk` scopes our default CSS;
  // `data-whisk-theme="dark"` lets host apps target `.dark` overrides.
  const themeAttr = resolveTheme(theme);

  return (
    <WhiskContext.Provider value={contextValue}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <div
            data-whisk=""
            data-whisk-theme={themeAttr}
            className={themeAttr === "dark" ? "dark" : undefined}
          >
            {children}
          </div>
        </WagmiProvider>
      </QueryClientProvider>
    </WhiskContext.Provider>
  );
}

function resolveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
