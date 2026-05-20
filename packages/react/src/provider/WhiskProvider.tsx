"use client";

import { useContext, useMemo, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { WagmiProvider, WagmiContext, type Config as WagmiConfig } from "wagmi";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { createWhisk, ConfigError } from "@signordev/whisk-core";
import type { WhiskClientConfig } from "../config/types.js";
import type { SolanaConfig } from "../config/adapters/solana.js";
import { createDefaultResolver } from "../resolvers/index.js";
import { WhiskContext, type WhiskContextValue } from "./context.js";

export type WhiskProviderProps = {
  config: WhiskClientConfig;
  /** `"system"` (default) defers to `prefers-color-scheme`. SSR-safe. */
  theme?: "light" | "dark" | "system";
  /** Reuse a host-app QueryClient. Outer `<QueryClientProvider>` is auto-detected. */
  queryClient?: QueryClient;
  children: ReactNode;
};

export function WhiskProvider({
  config,
  theme = "system",
  queryClient: externalQueryClient,
  children,
}: WhiskProviderProps) {
  // Stable engine per provider mount — preserves App Kit's internal caches.
  const engine = useMemo(
    () =>
      createWhisk({
        chains: config.chains,
        defaultSourceChain: config.defaultSourceChain,
        defaultDestinationChain: config.defaultDestinationChain,
        token: config.token,
        resolver:
          config.resolver ?? createDefaultResolver({ mode: config.mode }),
        feePolicy: config.feePolicy,
        rpcUrls: config.rpcUrls,
        useForwarder: config.useForwarder,
        mode: config.mode,
        appLabel: config.appLabel,
      }),
    // Engine config is intentionally frozen for the provider's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const contextValue: WhiskContextValue = useMemo(
    () => ({ engine, config }),
    [engine, config],
  );

  const evmFactory = config.wallets.find((w) => w.kind === "evm");
  const solanaFactory = config.wallets.find((w) => w.kind === "solana");
  const solanaConfig = solanaFactory?.config as SolanaConfig | undefined;

  // `useQueryClient` throws outside a provider, but the hook itself still runs every render.
  const outerWagmiConfig = useContext(WagmiContext);
  const hasOuterWagmi = !!outerWagmiConfig;

  let outerQueryClient: QueryClient | undefined;
  try {
    outerQueryClient = useQueryClient();
  } catch {
    outerQueryClient = undefined;
  }

  if (!evmFactory && !hasOuterWagmi) {
    throw new ConfigError(
      "WhiskProvider: include evm() in config.wallets, OR mount this provider inside an existing <WagmiProvider>. EVM hooks require a wagmi context to run.",
    );
  }

  const ourWagmiConfig: WagmiConfig | undefined =
    !hasOuterWagmi && evmFactory
      ? (evmFactory.config as WagmiConfig)
      : undefined;

  const ourQueryClient = useMemo(
    () => externalQueryClient ?? new QueryClient(),
    [externalQueryClient],
  );

  const themeAttr = theme === "system" ? undefined : theme;

  let inner: ReactNode = (
    <div
      data-whisk=""
      data-whisk-theme={themeAttr}
      className={theme === "dark" ? "dark" : undefined}
    >
      {children}
    </div>
  );

  if (solanaConfig) {
    inner = (
      <ConnectionProvider endpoint={solanaConfig.endpoint}>
        <WalletProvider
          wallets={solanaConfig.wallets}
          autoConnect={solanaConfig.autoConnect}
        >
          {inner}
        </WalletProvider>
      </ConnectionProvider>
    );
  }

  if (ourWagmiConfig) {
    inner = <WagmiProvider config={ourWagmiConfig}>{inner}</WagmiProvider>;
  }

  if (!outerQueryClient) {
    inner = (
      <QueryClientProvider client={ourQueryClient}>{inner}</QueryClientProvider>
    );
  }

  return (
    <WhiskContext.Provider value={contextValue}>{inner}</WhiskContext.Provider>
  );
}
