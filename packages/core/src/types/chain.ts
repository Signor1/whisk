/**
 * Whisk supports the full set of chains App Kit ships with, so devs can
 * pick from any testnet App Kit recognises. v0.1 exposes every chain
 * the underlying SDK accepts; the example app surfaces the testnets by
 * default, but downstream apps can opt into mainnet chains by listing
 * them in `createWhiskConfig({ chains })`.
 *
 * Values intentionally match Circle App Kit's `Blockchain` enum strings
 * so they pass straight through to the SDK without translation.
 */
export type Chain =
  // Mainnets
  | "Arbitrum"
  | "Avalanche"
  | "Base"
  | "Codex"
  | "Ethereum"
  | "HyperEVM"
  | "Ink"
  | "Linea"
  | "Monad"
  | "Optimism"
  | "Plume"
  | "Polygon"
  | "Sei"
  | "Solana"
  | "Sonic"
  | "Unichain"
  | "World_Chain"
  | "XDC"
  // Testnets
  | "Arbitrum_Sepolia"
  | "Arc_Testnet"
  | "Avalanche_Fuji"
  | "Base_Sepolia"
  | "Codex_Testnet"
  | "Ethereum_Sepolia"
  | "HyperEVM_Testnet"
  | "Ink_Testnet"
  | "Linea_Sepolia"
  | "Monad_Testnet"
  | "Optimism_Sepolia"
  | "Plume_Testnet"
  | "Polygon_Amoy_Testnet"
  | "Sei_Testnet"
  | "Solana_Devnet"
  | "Sonic_Testnet"
  | "Unichain_Sepolia"
  | "World_Chain_Sepolia"
  | "XDC_Apothem";

/**
 * Logical kind of a chain. Drives address validation and which adapter
 * can be used. Aptos / Near / Stellar etc. are out of scope for v1.
 */
export type ChainKind = "evm" | "solana";

/**
 * Network classification — mainnet vs testnet — derived from the Chain
 * literal. Useful for safety checks (don't accidentally send mainnet
 * funds on a wallet meant for testnet).
 */
export type ChainNetwork = "mainnet" | "testnet";
