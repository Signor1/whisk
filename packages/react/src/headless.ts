/**
 * Headless entry point. Pulls only the engine + hooks — no UI components,
 * no CSS. For host apps that render their own UI on top of Whisk's state
 * machine.
 */
export { WhiskProvider } from "./provider/WhiskProvider.js";
export type { WhiskProviderProps } from "./provider/WhiskProvider.js";

export {
  createWhiskConfig,
  evm,
  solana,
} from "./config/index.js";
export type {
  CreateWhiskConfigOptions,
  WhiskClientConfig,
  WalletAdapterFactory,
  EvmAdapterFactory,
  SolanaAdapterFactory,
  EvmFactoryOptions,
  SolanaFactoryOptions,
} from "./config/index.js";

export {
  useWhisk,
  useWhiskAdapter,
  useWhiskContext,
} from "./hooks/index.js";
export type { UseWhiskResult, WhiskActions } from "./hooks/index.js";

export type {
  Chain,
  Quote,
  ResolvedRecipient,
  Step,
  WhiskState,
  WhiskError,
} from "@strimz/whisk-core";
