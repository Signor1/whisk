import { createConfig, http } from "wagmi";
import {
  arbitrumSepolia,
  avalancheFuji,
  baseSepolia,
  optimismSepolia,
  polygonAmoy,
  sepolia,
} from "wagmi/chains";
import {
  coinbaseWallet,
  injected,
  walletConnect,
} from "wagmi/connectors";
import type { Chain as ViemChain } from "viem";
import type { Chain } from "@strimz/whisk-core";
import type { EvmAdapterFactory } from "../types.js";

/**
 * Whisk → viem chain mapping. Every Whisk EVM chain has a viem `Chain`
 * counterpart so wagmi knows which RPCs to use, what the chain ID is, etc.
 *
 * Chains where Circle App Kit ships native support but viem does not have
 * a built-in entry (e.g. Arc Testnet, Monad Testnet, Unichain Sepolia)
 * get an inline `defineChain` declaration so devs can use them without
 * additional setup.
 */
const ARC_TESTNET_CHAIN: ViemChain = {
  id: 421_614, // placeholder — Arc Testnet chain ID confirmed at runtime by App Kit
  name: "Arc Testnet",
  nativeCurrency: { name: "Arc", symbol: "ARC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.arc-testnet.network"] },
  },
  blockExplorers: {
    default: { name: "Arc Explorer", url: "https://testnet.arcscan.app" },
  },
  testnet: true,
};

const MONAD_TESTNET: ViemChain = {
  id: 10_143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  testnet: true,
};

const UNICHAIN_SEPOLIA: ViemChain = {
  id: 1_301,
  name: "Unichain Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia.unichain.org"] },
  },
  blockExplorers: {
    default: { name: "Uniscan", url: "https://sepolia.uniscan.xyz" },
  },
  testnet: true,
};

const VIEM_CHAIN_BY_WHISK: Partial<Record<Chain, ViemChain>> = {
  Arbitrum_Sepolia: arbitrumSepolia,
  Arc_Testnet: ARC_TESTNET_CHAIN,
  Avalanche_Fuji: avalancheFuji,
  Base_Sepolia: baseSepolia,
  Ethereum_Sepolia: sepolia,
  Monad_Testnet: MONAD_TESTNET,
  Optimism_Sepolia: optimismSepolia,
  Polygon_Amoy_Testnet: polygonAmoy,
  Unichain_Sepolia: UNICHAIN_SEPOLIA,
};

export type EvmFactoryOptions = {
  /**
   * The Whisk chains this EVM adapter should be configured for. Only EVM
   * chains in this list get a viem chain entry in the wagmi config; non-
   * EVM chains (Solana) are silently ignored. If omitted, the wagmi
   * config will include the most common testnets (Arc, Sepolia, Base).
   */
  chains?: Chain[];

  /**
   * WalletConnect Cloud project ID — required for WalletConnect connector.
   * Free at https://cloud.walletconnect.com. Omit it to disable
   * WalletConnect; injected (MetaMask, Rabby, browser-extension wallets)
   * and Coinbase Wallet still work.
   */
  projectId?: string;

  /**
   * Override the default RPC URL per chain. Strongly recommended for
   * production — public RPCs are rate-limited.
   */
  rpcUrls?: Partial<Record<Chain, string>>;

  /**
   * Display name shown to users in WalletConnect / Coinbase wallet
   * pairing dialogs.
   */
  appName?: string;
};

/**
 * Create an EVM wallet adapter factory backed by wagmi v2.
 *
 * Connectors enabled:
 * - **injected** — MetaMask, Rabby, Brave, Frame, any EIP-1193 extension.
 * - **coinbaseWallet** — Coinbase Wallet (mobile + extension).
 * - **walletConnect** — only when `projectId` is provided.
 *
 * The function returns an opaque marker that `WhiskProvider` consumes to
 * mount `WagmiProvider`. Importing `evm()` is what brings wagmi into your
 * app's bundle; apps that don't call it don't pay for wagmi at all.
 */
export function evm(options: EvmFactoryOptions = {}): EvmAdapterFactory {
  const chainList = options.chains ?? [
    "Arc_Testnet",
    "Ethereum_Sepolia",
    "Base_Sepolia",
  ];
  const viemChains = chainList
    .map((c) => VIEM_CHAIN_BY_WHISK[c])
    .filter((c): c is ViemChain => Boolean(c));

  if (viemChains.length === 0) {
    // No EVM chains supplied — the factory still returns a valid (but
    // empty) wagmi config so the provider can mount; the engine refuses
    // to operate on these chains until the dev adds at least one.
    viemChains.push(sepolia);
  }

  const transports = Object.fromEntries(
    viemChains.map((chain) => {
      const whiskKey = whiskKeyForViemChain(chain.id, chainList);
      const url = whiskKey ? options.rpcUrls?.[whiskKey] : undefined;
      return [chain.id, http(url)];
    }),
  );

  // wagmi's createConfig has overloads with non-empty tuple constraints on
  // `chains`. We've already guaranteed at least one chain above so the
  // cast is safe — it's a known limitation of TS narrowing across array
  // .filter calls.
  const config = createConfig({
    chains: viemChains as [ViemChain, ...ViemChain[]],
    transports,
    connectors: [
      injected({ shimDisconnect: true }),
      coinbaseWallet({ appName: options.appName ?? "Whisk" }),
      ...(options.projectId
        ? [
            walletConnect({
              projectId: options.projectId,
              metadata: {
                name: options.appName ?? "Whisk",
                description: "USDC widget powered by Whisk",
                url:
                  typeof window !== "undefined" ? window.location.origin : "",
                icons: [],
              },
            }),
          ]
        : []),
    ],
    ssr: true,
  });

  return { kind: "evm", config };
}

function whiskKeyForViemChain(
  viemId: number,
  whiskChains: Chain[],
): Chain | undefined {
  for (const chain of whiskChains) {
    const v = VIEM_CHAIN_BY_WHISK[chain];
    if (v?.id === viemId) return chain;
  }
  return undefined;
}
