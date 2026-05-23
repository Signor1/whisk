export { createWhiskConfig } from "./createWhiskConfig.js";
export type {
  CreateWhiskConfigOptions,
  WhiskClientConfig,
  WalletAdapterFactory,
  EvmAdapterFactory,
  SolanaAdapterFactory,
} from "./types.js";
// Re-export WhiskMode from core so consumers can type-annotate their
// own `mode: WhiskMode` props without importing core directly.
export type { WhiskMode } from "@usewhisk/core";
export { evm, type EvmFactoryOptions } from "./adapters/evm.js";
export { solana, type SolanaFactoryOptions } from "./adapters/solana.js";
