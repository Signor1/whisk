"use client";

import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import { ResolverError, chainInfo, type Resolver } from "@signordev/whisk-core";

/**
 * Which ENS deployment a resolver instance queries.
 *
 * - `"mainnet"` — Ethereum mainnet ENS. The canonical registry; where
 *   almost every real-world ENS name lives. Default for production.
 * - `"sepolia"` — Sepolia testnet ENS. A first-class deployment per
 *   ENS docs, useful when developers register test names for their
 *   integration flow without paying mainnet gas. Sparse compared to
 *   mainnet — only resolves names actually registered on Sepolia.
 */
export type EnsResolverChain = "mainnet" | "sepolia";

/**
 * Default Ethereum mainnet RPC endpoints used for ENS lookups when the
 * consumer doesn't pass one in. ENS resolution always queries L1 — even
 * when the destination is an L2 or non-Ethereum chain — because the
 * registry lives on mainnet.
 *
 * All entries are CORS-friendly public endpoints. viem's default
 * (`eth.merkle.io`) is excluded on purpose: it returns `Failed to
 * fetch` for browser-origin requests, which surfaces in the widget as
 * `ResolverError: ens resolver failed: HTTP request failed`.
 *
 * Used through viem's `fallback` transport with `rank: true`, so the
 * fastest healthy endpoint at any moment wins. If you're shipping to
 * production, prefer `createEnsResolver({ rpcUrl })` with your own
 * dedicated mainnet endpoint — these public RPCs rate-limit at scale.
 */
export const DEFAULT_ENS_RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.drpc.org",
  "https://cloudflare-eth.com",
] as const;

/**
 * Default Sepolia mainnet RPC endpoints used for testnet-mode ENS
 * lookups. All CORS-friendly public endpoints; behind viem's
 * `fallback` transport with latency ranking.
 */
export const DEFAULT_ENS_SEPOLIA_RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.ankr.com/eth_sepolia",
  "https://eth-sepolia.public.blastapi.io",
  "https://sepolia.drpc.org",
] as const;

export type EnsResolverOptions = {
  /**
   * Which ENS deployment to query — `"mainnet"` (default) or
   * `"sepolia"`. Sepolia is a real ENS deployment per the official
   * docs, useful for testnet-only apps that register their own test
   * names. The `defaultResolver` composition pairs both for testnet
   * mode (Sepolia → mainnet fallback).
   */
  chain?: EnsResolverChain;
  /**
   * Custom L1 RPC URL(s). Accepts:
   *
   *  - `undefined` — use the bundled CORS-friendly fallback chain for
   *    the selected `chain`.
   *  - a single URL string — replaces the fallback chain entirely.
   *  - an array of URLs — used with viem's `fallback` transport and
   *    latency ranking, so the fastest healthy endpoint wins.
   *
   * Production apps should pass their own dedicated endpoint (Alchemy
   * / Infura / QuickNode / their own node) — the bundled defaults are
   * shared public RPCs that rate-limit at scale.
   */
  rpcUrl?: string | string[];
  /**
   * Override the public client viem uses for ENS lookups. Useful when
   * the host already has a wagmi config + a mainnet client and wants
   * to reuse the connection rather than spin up a second one.
   */
  client?: PublicClient;
  /**
   * When the destination-chain coinType lookup returns null (the name
   * has no ENSIP-11 record for the target chain), retry with the
   * Ethereum mainnet coinType (60) as a fallback. For EVM destinations
   * the resulting `0x...` address is namespace-equivalent across all
   * EVM chains — `vitalik.eth` returns his mainnet address, which is
   * also his valid address on Base Sepolia, Arbitrum, etc.
   *
   * Solana destinations are unaffected: a `0x...` address fails the
   * destination chain's regex check and the resolver returns null,
   * so we can't accidentally cross ecosystems.
   *
   * Defaults to `true` — matches the behaviour wallets like MetaMask
   * and Rainbow already exhibit and aligns with user intuition. Set
   * to `false` for strict resolution (return null if no destination
   * record exists).
   */
  fallbackToEthAddress?: boolean;
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
  const ensChain: EnsResolverChain = options.chain ?? "mainnet";
  const fallbackToEthAddress = options.fallbackToEthAddress ?? true;
  let cachedClient: PublicClient | undefined = options.client;
  const getClient = (): PublicClient => {
    if (cachedClient) return cachedClient;
    const urls = resolveRpcList(ensChain, options.rpcUrl);
    const transport =
      urls.length > 1
        ? fallback(
            urls.map((u) => http(u)),
            { rank: true },
          )
        : http(urls[0]);
    cachedClient = createPublicClient({
      chain: ensChain === "sepolia" ? sepolia : mainnet,
      transport,
    });
    return cachedClient;
  };

  // Resolver name carries the chain so logs / multi-resolver
  // compositions can tell instances apart in a debugger.
  const name = `ens:${ensChain}`;

  return {
    name,
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
      const destinationCoinType = ensCoinTypeForChain(info);

      const client = getClient();

      // Attempt 1: destination-chain coinType (the precise lookup).
      const primary = await safeGetEnsAddress(
        client,
        normalized,
        destinationCoinType,
      );
      if (primary && info.addressRegex.test(primary)) {
        return { address: primary, chain: ctx.chain };
      }

      // Attempt 2: Ethereum mainnet coinType (60) as a fallback. EVM
      // addresses are namespace-equivalent across every EVM chain —
      // same private key controls the same address everywhere — so
      // the user's mainnet address is also their valid address on
      // every other EVM chain. The destination-chain regex check
      // below keeps Solana destinations safe (a 0x... address fails
      // the Solana regex → returns null).
      if (
        fallbackToEthAddress &&
        info.kind === "evm" &&
        destinationCoinType !== 60
      ) {
        const fallbackAddr = await safeGetEnsAddress(client, normalized, 60);
        if (fallbackAddr && info.addressRegex.test(fallbackAddr)) {
          return { address: fallbackAddr, chain: ctx.chain };
        }
      }

      return null;
    },
  };
}

/**
 * Wrap `getEnsAddress` so caller can branch on null vs error without
 * a nested try/catch. Network failures throw a `ResolverError`;
 * not-found / no-record returns null (the resolver chain then either
 * tries the fallback path above, or passes to the next resolver).
 */
async function safeGetEnsAddress(
  client: PublicClient,
  name: string,
  coinType: number | undefined,
): Promise<string | null> {
  try {
    const addr = await client.getEnsAddress({
      name,
      ...(coinType !== undefined ? { coinType: BigInt(coinType) } : {}),
    });
    return addr ?? null;
  } catch (err) {
    throw new ResolverError(
      "ens",
      err instanceof Error ? err.message : "ENS lookup failed",
      err,
    );
  }
}

/**
 * Normalise the `rpcUrl` option into an array. `undefined` → bundled
 * fallback chain for the selected ENS chain; string → single-entry
 * array; array → as-is.
 */
function resolveRpcList(
  chain: EnsResolverChain,
  rpcUrl: EnsResolverOptions["rpcUrl"],
): string[] {
  const defaults =
    chain === "sepolia" ? DEFAULT_ENS_SEPOLIA_RPC_URLS : DEFAULT_ENS_RPC_URLS;
  if (!rpcUrl) return [...defaults];
  if (typeof rpcUrl === "string") return [rpcUrl];
  return rpcUrl.length > 0 ? [...rpcUrl] : [...defaults];
}

/**
 * Default ENS resolver, ready to use without configuration. Queries
 * mainnet ENS with the bundled fallback chain of CORS-friendly public
 * RPCs — fine for development. Replace with `createEnsResolver({ rpcUrl })`
 * in production. Pair with `createEnsResolver({ chain: "sepolia" })`
 * via `composeResolvers` for testnet apps — see `createDefaultResolver`.
 */
export const ensResolver: Resolver = createEnsResolver();

/**
 * Sepolia-side ENS resolver — queries the Sepolia ENS deployment for
 * names registered on Sepolia. Sparse compared to mainnet, but
 * first-class per ENS docs and useful when devs register their own
 * test names without paying mainnet gas.
 */
export const sepoliaEnsResolver: Resolver = createEnsResolver({
  chain: "sepolia",
});

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
