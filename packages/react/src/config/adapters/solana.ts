import type { Adapter } from "@solana/wallet-adapter-base";
import type { SolanaAdapterFactory } from "../types.js";

export type SolanaCluster = "mainnet-beta" | "devnet" | "testnet";

/**
 * Resolved config the WhiskProvider feeds into
 * `<ConnectionProvider>` + `<WalletProvider>`.
 */
export type SolanaConfig = {
  cluster: SolanaCluster;
  endpoint: string;
  autoConnect: boolean;
  /**
   * Explicit wallet adapters. Leave empty (the default) — modern wallets
   * (Phantom, Solflare, Backpack, ...) advertise themselves via the
   * Solana Wallet Standard, which `wallet-adapter-react` auto-discovers
   * at runtime. Adapters here are only needed for legacy / custom
   * wallets that don't implement the standard.
   */
  wallets: Adapter[];
};

export type SolanaFactoryOptions = {
  /** Solana cluster to target. Defaults to `devnet`. */
  cluster?: SolanaCluster;
  /**
   * Custom RPC endpoint. Defaults to the public cluster endpoint, which
   * is fine for development but rate-limited in production — pass a
   * paid RPC URL (Helius, Triton, QuickNode) for live apps.
   */
  endpoint?: string;
  /**
   * Auto-reconnect on mount. Off by default — explicit user action is
   * a saner default for embedded payment widgets where surprising
   * wallet popups erode trust.
   */
  autoConnect?: boolean;
  /**
   * Legacy wallet adapters to register alongside Wallet Standard
   * auto-discovery. Empty by default; modern wallets don't need this.
   */
  wallets?: Adapter[];
};

const CLUSTER_RPC: Record<SolanaCluster, string> = {
  "mainnet-beta": "https://api.mainnet-beta.solana.com",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
};

/**
 * Create a Solana wallet adapter factory. Pair with `evm()` in
 * `createWhiskConfig({ wallets: [evm({...}), solana()] })` to enable
 * Solana send + bridge flows.
 *
 * The factory itself is lightweight — it just packages the config the
 * WhiskProvider needs to mount `<ConnectionProvider>` + `<WalletProvider>`.
 * No network calls happen here.
 */
export function solana(options: SolanaFactoryOptions = {}): SolanaAdapterFactory {
  const cluster = options.cluster ?? "devnet";
  const config: SolanaConfig = {
    cluster,
    endpoint: options.endpoint ?? CLUSTER_RPC[cluster],
    autoConnect: options.autoConnect ?? false,
    wallets: options.wallets ?? [],
  };
  return { kind: "solana", config };
}
