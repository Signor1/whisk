/**
 * Whisk supports a curated subset of the chains App Kit supports — the ones
 * where USDC sends/bridges are well-tested and faucets exist. Adding a chain
 * is a one-entry change in `chain-registry.ts`.
 *
 * Values intentionally match Circle App Kit's `Blockchain` enum strings so
 * they pass straight through to the SDK without translation.
 */
export type Chain =
  // Mainnets (enabled in v1; widget UI may still hide them by default)
  | "Arbitrum"
  | "Avalanche"
  | "Base"
  | "Ethereum"
  | "Optimism"
  | "Polygon"
  | "Solana"
  | "Unichain"
  // Testnets — recommended for getting started
  | "Arbitrum_Sepolia"
  | "Arc_Testnet"
  | "Avalanche_Fuji"
  | "Base_Sepolia"
  | "Ethereum_Sepolia"
  | "Monad_Testnet"
  | "Optimism_Sepolia"
  | "Polygon_Amoy_Testnet"
  | "Solana_Devnet"
  | "Unichain_Sepolia";

/**
 * Logical kind of a chain. Drives address validation and which adapter can
 * be used. Aptos/Near/etc. are not in scope for v1.
 */
export type ChainKind = "evm" | "solana";

/**
 * Network classification — mainnet vs testnet — derived from the Chain
 * literal. Useful for safety checks (don't accidentally send mainnet funds
 * on a wallet meant for testnet).
 */
export type ChainNetwork = "mainnet" | "testnet";
