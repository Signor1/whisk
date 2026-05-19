"use client";

import {
  addressResolver,
  composeResolvers,
  type Resolver,
  type WhiskMode,
} from "@signordev/whisk-core";
import {
  createEnsResolver,
  ensResolver,
  sepoliaEnsResolver,
  DEFAULT_ENS_RPC_URLS,
  DEFAULT_ENS_SEPOLIA_RPC_URLS,
  type EnsResolverChain,
  type EnsResolverOptions,
} from "./ensResolver.js";

export {
  createEnsResolver,
  ensResolver,
  sepoliaEnsResolver,
  DEFAULT_ENS_RPC_URLS,
  DEFAULT_ENS_SEPOLIA_RPC_URLS,
};
export type { EnsResolverChain, EnsResolverOptions };

/**
 * The default resolver chain Whisk's React widget uses when the host
 * doesn't pass a custom `resolver` to `createWhiskConfig`.
 *
 *   1. `addressResolver` — short-circuits raw `0x…` and base58
 *      addresses, no network round-trip needed.
 *   2. `ensResolver` — ENS forward lookup against **mainnet** with
 *      ENSIP-11 multichain coinTypes, so `vitalik.eth` resolves to
 *      the right address for whichever destination chain the user
 *      picked.
 *
 * Mainnet-only by default. For testnet apps, use
 * `createDefaultResolver({ mode: "testnet" })` to compose in a
 * Sepolia-first → mainnet-fallback ENS chain instead.
 *
 * Devs who want protocol-specific name services (Lens, Farcaster,
 * Unstoppable, Solana SNS, etc.) compose them in alongside these:
 *
 * ```ts
 * import {
 *   addressResolver,
 *   composeResolvers,
 *   ensResolver,
 *   myCustomResolver,
 * } from "@signordev/whisk-react";
 *
 * createWhiskConfig({
 *   resolver: composeResolvers([
 *     addressResolver,
 *     ensResolver,
 *     myCustomResolver,
 *   ]),
 *   …,
 * });
 * ```
 */
export const defaultResolver: Resolver = composeResolvers(
  [addressResolver, ensResolver],
  { name: "default" },
);

export type CreateDefaultResolverOptions = EnsResolverOptions & {
  /**
   * Operational mode of the host widget. When `"testnet"`, the
   * resolver chain queries Sepolia ENS first and falls back to
   * mainnet ENS — letting devs register their own Sepolia test names
   * while still resolving normal mainnet names. When `"mainnet"`
   * (default), queries only mainnet ENS.
   */
  mode?: WhiskMode;
};

/**
 * Build a default resolver chain. Composes `addressResolver` with the
 * right ENS resolver(s) for the host's operational mode.
 *
 * - `mode: "mainnet"` (default) → `[address, mainnet-ens]`
 * - `mode: "testnet"` → `[address, sepolia-ens, mainnet-ens]`
 *
 * The testnet variant tries Sepolia first (cheap if a name is
 * registered there) and falls back to mainnet ENS — the same
 * mainnet name lookup users intuitively expect, just inside a
 * testnet-flavoured composition. Custom `rpcUrl` or `client` options
 * apply to *both* ENS resolvers in testnet mode.
 */
export function createDefaultResolver(
  options: CreateDefaultResolverOptions = {},
): Resolver {
  const { mode = "mainnet", ...ensOptions } = options;
  if (mode === "testnet") {
    return composeResolvers(
      [
        addressResolver,
        createEnsResolver({ ...ensOptions, chain: "sepolia" }),
        createEnsResolver({ ...ensOptions, chain: "mainnet" }),
      ],
      { name: "default-testnet" },
    );
  }
  return composeResolvers(
    [addressResolver, createEnsResolver({ ...ensOptions, chain: "mainnet" })],
    { name: "default-mainnet" },
  );
}
