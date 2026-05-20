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

/** Mainnet-only. Use `createDefaultResolver({ mode: "testnet" })` for the Sepolia-first variant. */
export const defaultResolver: Resolver = composeResolvers(
  [addressResolver, ensResolver],
  { name: "default" },
);

export type CreateDefaultResolverOptions = EnsResolverOptions & {
  mode?: WhiskMode;
};

/** testnet → [address, sepolia-ens, mainnet-ens]; mainnet → [address, mainnet-ens]. */
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
