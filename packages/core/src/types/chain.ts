/** Values match Circle App Kit's `Blockchain` enum strings. */
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

export type ChainKind = "evm" | "solana";

export type ChainNetwork = "mainnet" | "testnet";
