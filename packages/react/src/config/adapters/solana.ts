import type { Adapter } from "@solana/wallet-adapter-base";
import type { SolanaAdapterFactory } from "../types.js";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

/** @deprecated Use {@link SolanaNetwork}. */
export type SolanaCluster = SolanaNetwork;

export type SolanaConfig = {
  network: SolanaNetwork;
  endpoint: string;
  autoConnect: boolean;
  /** Modern wallets advertise via Wallet Standard; only needed for legacy adapters. */
  wallets: Adapter[];
};

export type SolanaFactoryOptions = {
  /** Defaults to `devnet`. */
  network?: SolanaNetwork;
  /** @deprecated Renamed to `network`. Removed in v0.3. */
  cluster?: SolanaNetwork;
  /** Defaults to the public network endpoint — pass a paid RPC for production. */
  endpoint?: string;
  /** Default `false` — explicit user action is saner for embedded widgets. */
  autoConnect?: boolean;
  wallets?: Adapter[];
};

const NETWORK_RPC: Record<SolanaNetwork, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};

export function solana(
  options: SolanaFactoryOptions = {},
): SolanaAdapterFactory {
  const network = options.network ?? options.cluster ?? "devnet";
  const config: SolanaConfig = {
    network,
    endpoint: options.endpoint ?? NETWORK_RPC[network],
    autoConnect: options.autoConnect ?? false,
    wallets: options.wallets ?? [],
  };
  return { kind: "solana", config };
}
