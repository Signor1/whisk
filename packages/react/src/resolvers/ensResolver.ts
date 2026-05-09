"use client";

import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";
import {
  ResolverError,
  chainInfo,
  type Resolver,
} from "@strimz/whisk-core";

export type EnsResolverOptions = {
  /**
   * Custom Ethereum L1 RPC URL. Defaults to viem's public mainnet
   * endpoint, which is rate-limited and shared. Production apps should
   * pass their own (Alchemy / Infura / QuickNode / their own node).
   */
  rpcUrl?: string;
  /**
   * Override the public client viem uses for ENS lookups. Useful when
   * the host already has a wagmi config + a mainnet client and wants
   * to reuse the connection rather than spin up a second one.
   */
  client?: PublicClient;
};

/**
 * ENS resolver — turns `vitalik.eth` (or any other ENS-compatible name)
 * into the correct on-chain address for the **destination chain** the
 * user is sending to.
 *
 * Multichain handling follows ENSIP-11: for every supported destination
 * chain we ask the L1 resolver for that chain's coinType and read the
 * stored address. This works transparently for Ethereum mainnet
 * (coinType 60), every other EVM chain (coinType `0x80000000 | chainId`,
 * unsigned), and would work for Solana (coinType 501) once the rest of
 * Solana support lands.
 *
 * Important: ENS resolution always starts from Ethereum L1 even when
 * the destination chain isn't Ethereum. The resolver builds a viem
 * mainnet public client once and reuses it.
 *
 * Falls through silently (returns `null`) when the name doesn't have
 * an address record for the requested chain — `composeResolvers` then
 * gives the next resolver a chance, and ultimately the engine surfaces
 * `InvalidAddressError` if no resolver finds anything.
 */
export function createEnsResolver(options: EnsResolverOptions = {}): Resolver {
  let cachedClient: PublicClient | undefined = options.client;
  const getClient = (): PublicClient => {
    if (cachedClient) return cachedClient;
    cachedClient = createPublicClient({
      chain: mainnet,
      transport: options.rpcUrl ? http(options.rpcUrl) : http(),
    });
    return cachedClient;
  };

  return {
    name: "ens",
    /**
     * Cheap shape check — anything ending in a TLD-shaped suffix.
     * Real ENS names cover `.eth` plus DNS-imported TLDs (`.com`,
     * `.xyz`, `.luxe`, `.kred`, etc.), so we accept any
     * `<label>.<tld>` rather than hard-coding `.eth`. The expensive
     * lookup is gated on an actual L1 query.
     */
    matches: (input) => /\.[a-z0-9]{2,}$/i.test(input.trim()),
    resolve: async (input, ctx) => {
      const trimmed = input.trim();
      let normalized: string;
      try {
        normalized = normalize(trimmed);
      } catch {
        // Invalid UTS-46 normalisation — not a real ENS name. Let the
        // next resolver try.
        return null;
      }

      const info = chainInfo(ctx.chain);
      const coinType = ensCoinTypeForChain(info);

      try {
        const client = getClient();
        const address = await client.getEnsAddress({
          name: normalized,
          ...(coinType !== undefined ? { coinType: BigInt(coinType) } : {}),
        });
        if (!address) return null;
        // Defensive: validate the resolved address actually fits the
        // destination chain's regex. If the ENS owner stored something
        // shaped wrong for this chain, treat as not-resolved.
        if (!info.addressRegex.test(address)) return null;
        return { address, chain: ctx.chain };
      } catch (err) {
        // Network / RPC failure → throw so the engine surfaces a
        // retryable error to the UI rather than silently moving on.
        throw new ResolverError(
          "ens",
          err instanceof Error ? err.message : "ENS lookup failed",
          err,
        );
      }
    },
  };
}

/**
 * Default ENS resolver, ready to use without configuration. Uses
 * viem's public Ethereum mainnet RPC — fine for development, replace
 * with `createEnsResolver({ rpcUrl })` in production.
 */
export const ensResolver: Resolver = createEnsResolver();

/* -------------------------------------------------------------------------- */
/*  ENSIP-11 coinType derivation                                              */
/*                                                                            */
/*  - Ethereum mainnet  → coinType 60 (legacy SLIP-0044 Ethereum slot)        */
/*  - Other EVM chains  → 0x80000000 | chainId (unsigned 32-bit)              */
/*  - Solana            → coinType 501 (SLIP-0044) — for v0.2                  */
/*  - Anything else     → undefined (skip ENS for that destination)           */
/* -------------------------------------------------------------------------- */

function ensCoinTypeForChain(
  info: ReturnType<typeof chainInfo>,
): number | undefined {
  if (info.kind === "evm") {
    if (info.evmChainId === 1) return 60;
    if (typeof info.evmChainId === "number") {
      // Force unsigned 32-bit. JavaScript's `|` returns a signed int32,
      // and chainIds large enough to flip the sign bit (e.g. anything
      // ≥ 2^31) would otherwise come out negative.
      return (0x80000000 | info.evmChainId) >>> 0;
    }
    return undefined;
  }
  if (info.kind === "solana") {
    return 501; // SLIP-0044 — engaged when Solana support comes back.
  }
  return undefined;
}
