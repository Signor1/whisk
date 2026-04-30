/**
 * `@strimz/whisk-core` — framework-agnostic engine, types, errors, and
 * helpers for the Whisk USDC widget.
 *
 * Most apps will consume `@strimz/whisk-react` instead. Reach for this
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
  Resolver,
  ResolverContext,
  WhiskState,
  WhiskStateKind,
} from "./types/index.js";
export { DEFAULT_TOKEN, isBridgeRoute, isSendRoute } from "./types/index.js";

// Chains
export {
  chainInfo,
  allChains,
  chainsByNetwork,
  chainsByKind,
  explorerTxUrl,
  explorerAddressUrl,
} from "./chains/index.js";
export type { ChainInfo } from "./chains/index.js";

// Resolvers
export { addressResolver, composeResolvers } from "./resolvers/index.js";

// Routing
export { decideRoute } from "./routing/index.js";

// Fees
export { buildCustomFeeEntries, fromAppKitFees, sumFees } from "./fees/index.js";

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
  ConfigError,
  toWhiskError,
} from "./errors/index.js";
export type { WhiskErrorCode, WhiskErrorOptions } from "./errors/index.js";
