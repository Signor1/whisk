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
  /** The frozen config from `createWhiskConfig(...)`. */
  config: WhiskClientConfig;
  /**
   * Theme mode.
   *
   * - `"system"` (default): no `data-whisk-theme` attribute is rendered.
   *   The widget defers to the user's OS preference via the
   *   `@media (prefers-color-scheme: dark)` rule in `styles.css`. SSR-
   *   safe: server and client produce identical markup.
   * - `"light"` / `"dark"`: pinned. `data-whisk-theme` is set explicitly
   *   so dev intent always beats OS preference.
   */
  theme?: "light" | "dark" | "system";
  /**
   * Reuse a host-app QueryClient instead of letting Whisk create its own.
   * Pass your existing client when Whisk is mounted inside an app that
   * already runs `@tanstack/react-query`. Whisk also auto-detects an
   * outer `<QueryClientProvider>` and reuses its client — explicit pass
   * is just clearer when you know the layout.
   */
  queryClient?: QueryClient;
  children: ReactNode;
};

/**
 * Mount Whisk's provider stack.
 *
 * Whisk reads the surrounding tree and only mounts what's missing:
 *
 * - **Outer `<WagmiProvider>` detected** → reuse it, skip the inner one.
 *   `evm()` becomes optional in this case; the host's wagmi config is
 *   what drives EVM operations.
 * - **Outer `<QueryClientProvider>` detected** → reuse its client.
 * - **Otherwise** → mount our own using configs from `evm()` and the
 *   optional `queryClient` prop.
 *
 * Solana's `<ConnectionProvider>` + `<WalletProvider>` is mounted only
 * when `solana()` is in `config.wallets`. Apps that don't touch Solana
 * pay nothing for it.
 *
 * Provider order from inside out: children → Solana wrappers (when
 * `solana()` is present) → WagmiProvider (when no outer one) →
 * QueryClientProvider (when no outer one) → WhiskContext.
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
        // Falls back to a mode-aware default resolver when the dev
        // hasn't passed a custom one. In testnet mode, the chain is
        // Sepolia ENS → mainnet ENS fallback (so devs can register
        // their own Sepolia test names but still resolve mainnet
        // names like `vitalik.eth`). In mainnet mode, mainnet only.
        // `createWhisk` resolves `config.mode` from the chain list
        // when omitted; we re-derive here so the resolver lines up.
        resolver:
          config.resolver ?? createDefaultResolver({ mode: config.mode }),
        feePolicy: config.feePolicy,
        rpcUrls: config.rpcUrls,
        useForwarder: config.useForwarder,
        mode: config.mode,
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

  const evmFactory = config.wallets.find((w) => w.kind === "evm");
  const solanaFactory = config.wallets.find((w) => w.kind === "solana");
  const solanaConfig = solanaFactory?.config as SolanaConfig | undefined;

  /* ── Detect outer providers ───────────────────────────────────────
   *
   * `useContext(WagmiContext)` is null when not inside a `<WagmiProvider>`
   * — that's the BYO signal.
   *
   * `useQueryClient()` throws when not inside `<QueryClientProvider>`,
   * so we wrap it. The hook is still called unconditionally on every
   * render, satisfying the rules of hooks.
   */
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

  // Only build our own wagmi tree if no outer one exists.
  const ourWagmiConfig: WagmiConfig | undefined =
    !hasOuterWagmi && evmFactory
      ? (evmFactory.config as WagmiConfig)
      : undefined;

  // QueryClient: prefer outer, then host-supplied prop, then our own.
  const ourQueryClient = useMemo(
    () => externalQueryClient ?? new QueryClient(),
    [externalQueryClient],
  );

  // ─── Theme attribute resolution ───────────────────────────────────────
  //
  // Deterministic and SSR-safe. No `window.matchMedia`, no `useEffect`,
  // no flash. The CSS layer in `styles.css` handles dark mode via a
  // `prefers-color-scheme` media query when no explicit theme is set;
  // explicit `light`/`dark` here pins the colour scheme.
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

  // Solana stack — innermost so EVM hooks above it can read wagmi state
  // without traversing through Solana's context.
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

  // Mount our own WagmiProvider only when no outer one exists.
  if (ourWagmiConfig) {
    inner = <WagmiProvider config={ourWagmiConfig}>{inner}</WagmiProvider>;
  }

  // Mount our own QueryClientProvider only when no outer one exists.
  if (!outerQueryClient) {
    inner = (
      <QueryClientProvider client={ourQueryClient}>{inner}</QueryClientProvider>
    );
  }

  return (
    <WhiskContext.Provider value={contextValue}>{inner}</WhiskContext.Provider>
  );
}
