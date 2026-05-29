"use client";

import { createPublicClient, fallback, http, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";
import {
  ResolverError,
  chainInfo,
  cleanErrorMessage,
  type Resolver,
} from "@usewhisk/core";

export type EnsResolverChain = "mainnet" | "sepolia";

// viem's default `eth.merkle.io` fails CORS in browsers. These are all CORS-friendly.
export const DEFAULT_ENS_RPC_URLS = [
  "https://eth.llamarpc.com",
  "https://ethereum-rpc.publicnode.com",
  "https://rpc.ankr.com/eth",
  "https://eth.drpc.org",
  "https://cloudflare-eth.com",
] as const;

export const DEFAULT_ENS_SEPOLIA_RPC_URLS = [
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://rpc.ankr.com/eth_sepolia",
  "https://eth-sepolia.public.blastapi.io",
  "https://sepolia.drpc.org",
] as const;

export type EnsResolverOptions = {
  chain?: EnsResolverChain;
  /** `undefined` → bundled fallback chain; string → single URL; array → viem `fallback` with latency ranking. */
  rpcUrl?: string | string[];
  /** Reuse an existing viem client (e.g. from wagmi) instead of constructing one. */
  client?: PublicClient;
  /**
   * When the destination coinType returns null, retry with Ethereum
   * mainnet coinType 60. Safe for EVM (addresses are namespace-equivalent);
   * Solana destinations stay safe via the destination regex check.
   * Defaults to `true` — matches MetaMask / Rainbow behaviour.
   */
  fallbackToEthAddress?: boolean;
};

/** ENS resolver with ENSIP-11 multichain coinType lookup. Always queries L1. */
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

  const name = `ens:${ensChain}`;

  return {
    name,
    // Accept any `<label>.<tld>` shape — DNS-imported TLDs work too.
    matches: (input) => /\.[a-z0-9]{2,}$/i.test(input.trim()),
    resolve: async (input, ctx) => {
      const trimmed = input.trim();
      let normalized: string;
      try {
        normalized = normalize(trimmed);
      } catch {
        return null;
      }

      const info = chainInfo(ctx.chain);
      const destinationCoinType = ensCoinTypeForChain(info);

      const client = getClient();

      const primary = await safeGetEnsAddress(
        client,
        normalized,
        destinationCoinType,
      );
      if (primary && info.addressRegex.test(primary)) {
        return { address: primary, chain: ctx.chain };
      }

      // EVM addresses are namespace-equivalent; Solana regex check keeps cross-ecosystem safe.
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
      err instanceof Error
        ? cleanErrorMessage(err.message)
        : "ENS lookup failed",
      err,
    );
  }
}

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

export const ensResolver: Resolver = createEnsResolver();

export const sepoliaEnsResolver: Resolver = createEnsResolver({
  chain: "sepolia",
});

// ENSIP-11: mainnet → 60, other EVM → unsigned (0x80000000 | chainId), Solana → 501.
function ensCoinTypeForChain(
  info: ReturnType<typeof chainInfo>,
): number | undefined {
  if (info.kind === "evm") {
    if (info.evmChainId === 1) return 60;
    if (typeof info.evmChainId === "number") {
      // `|` returns signed int32 — coerce to unsigned for chainIds ≥ 2^31.
      return (0x80000000 | info.evmChainId) >>> 0;
    }
    return undefined;
  }
  if (info.kind === "solana") {
    return 501;
  }
  return undefined;
}
