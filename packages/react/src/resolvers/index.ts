"use client";

import {
  addressResolver,
  composeResolvers,
  type Resolver,
} from "@strimz/whisk-core";
import {
  createEnsResolver,
  ensResolver,
  type EnsResolverOptions,
} from "./ensResolver.js";

export { createEnsResolver, ensResolver };
export type { EnsResolverOptions };

/**
 * The default resolver chain Whisk's React widget uses when the host
 * doesn't pass a custom `resolver` to `createWhiskConfig`.
 *
 *   1. `addressResolver` — short-circuits raw `0x…` and base58
 *      addresses, no network round-trip needed.
 *   2. `ensResolver` — ENS forward lookup with ENSIP-11 multichain
 *      coinTypes, so `vitalik.eth` resolves to the right address for
 *      whichever destination chain the user picked.
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
 * } from "@strimz/whisk-react";
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
 *
 * Also exposed as `defaultResolver` so `createEnsResolver({ rpcUrl })`
 * users can re-compose with a custom RPC without re-listing the chain.
 */
export const defaultResolver: Resolver = composeResolvers(
  [addressResolver, ensResolver],
  { name: "default" },
);

/**
 * Build a default resolver chain backed by a custom Ethereum L1 RPC.
 * Equivalent to `composeResolvers([addressResolver, createEnsResolver({ rpcUrl })])`
 * but reads better at the call site.
 */
export function createDefaultResolver(options: EnsResolverOptions = {}): Resolver {
  return composeResolvers(
    [addressResolver, createEnsResolver(options)],
    { name: "default" },
  );
}
