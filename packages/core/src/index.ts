/**
 * `@usewhisk/core` — framework-agnostic engine, types, errors, and
 * helpers for the Whisk USDC widget.
 *
 * Most apps will consume `@usewhisk/react` instead. Reach for this
 * package directly only when building a Whisk frontend in something other
 * than React, or when running engine logic on a server.
 */

// Engine
export { createWhisk } from "./engine/createWhisk.js";
export type {
  WhiskEngine,
  WhiskAdapter,
  QuoteParams,
  SendParams,
  SendListeners,
  SendStepListener,
  SendResult,
  SendSuccess,
  SendFailure,
  RetryParams,
  SwapParams,
  SwapEstimate,
  SwapResult,
  SwapSuccess,
  SwapFailure,
} from "./engine/types.js";

// Types
export type {
  Chain,
  ChainKind,
  ChainNetwork,
  Token,
  ResolvedRecipient,
  Route,
  FeePolicy,
  FeeEntry,
  FeeEntryKind,
  FeeBreakdown,
  StepName,
  StepState,
  Step,
  Quote,
  WhiskConfig,
  WhiskMode,
  Resolver,
  ResolverContext,
  WhiskState,
  WhiskStateKind,
} from "./types/index.js";
export { DEFAULT_TOKEN, isBridgeRoute, isSendRoute } from "./types/index.js";

// Chains
export {
  chainInfo,
  chainByEvmId,
  allChains,
  chainsByNetwork,
  chainsByKind,
  explorerTxUrl,
  explorerAddressUrl,
  supportedTokensFor,
  tokenAddressFor,
} from "./chains/index.js";
export type { ChainInfo, SupportedTokenAlias } from "./chains/index.js";

// Resolvers
export { addressResolver, composeResolvers } from "./resolvers/index.js";

// Routing
export { decideRoute } from "./routing/index.js";

// Fees
export {
  buildCustomFeeEntries,
  fromAppKitFees,
  sumFees,
} from "./fees/index.js";

// State machine
export { reduce, initialState, initialSteps } from "./state/index.js";
export type { WhiskAction } from "./state/index.js";

// Errors
export {
  WhiskError,
  NoAdapterError,
  WrongChainError,
  InsufficientBalanceError,
  InvalidAddressError,
  ResolverError,
  BridgeStepError,
  UserRejectedError,
  NetworkError,
  WalletCapabilityError,
  OnchainRevertError,
  ConfigError,
  toWhiskError,
} from "./errors/index.js";
export type {
  WhiskErrorCode,
  WhiskErrorCategory,
  WhiskErrorOptions,
} from "./errors/index.js";

// Recovery primitives
export {
  saveInflight,
  loadInflight,
  clearInflight,
  listInflightSnapshots,
  serializeError,
  deserializeError,
  INFLIGHT_TTL_MS,
  STORAGE_PREFIX,
  fetchAttestationOnce,
  pollAttestation,
  getIrisBaseUrl,
  IRIS_MAINNET_URL,
  IRIS_SANDBOX_URL,
  buildReceiveMessageCall,
  messageTransmitterAddress,
  manualMintExplorerUrl,
  RECEIVE_MESSAGE_ABI,
  EVM_MAINNET_MESSAGE_TRANSMITTER,
  EVM_TESTNET_MESSAGE_TRANSMITTER,
  SOLANA_MESSAGE_TRANSMITTER,
} from "./recovery/index.js";
export type {
  InflightSnapshot,
  WalletKind,
  IrisMessage,
  IrisStatus,
  FetchAttestationOptions,
  PollAttestationOptions,
  ReceiveMessageCall,
} from "./recovery/index.js";

// CCTP domain helpers
export { cctpDomainFor, chainForCctpDomain } from "./chains/cctpDomain.js";
export { inferMode, resolveMode } from "./chains/mode.js";
