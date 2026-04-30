import type { SolanaAdapterFactory } from "../types.js";

export type SolanaFactoryOptions = {
  /**
   * Solana cluster to target. Whisk accepts the long-form here so the
   * factory's surface stays expressive without leaking solana-web3.js
   * types into Whisk's public API.
   */
  cluster?: "mainnet-beta" | "devnet" | "testnet";
};

/**
 * Create a Solana wallet adapter factory.
 *
 * **Status: stubbed for v0.2.** Importing this in v0.1 returns a marker
 * that the WhiskProvider rejects at mount time with a clear error; we'd
 * rather hard-fail than ship a partially-working code path.
 *
 * The full implementation will pull in `@solana/wallet-adapter-react`,
 * `@solana/wallet-adapter-wallets`, and `@circle-fin/adapter-solana-kit`.
 * It lands in v0.2 alongside Solana-aware UI for the address picker.
 */
export function solana(_options: SolanaFactoryOptions = {}): SolanaAdapterFactory {
  return {
    kind: "solana",
    config: undefined,
  };
}
