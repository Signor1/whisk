/**
 * `@strimz/whisk-react` — embeddable USDC send & bridge widget.
 *
 * The drop-in entry point. Most apps:
 *
 * ```tsx
 * import {
 *   WhiskProvider,
 *   WhiskSend,
 *   createWhiskConfig,
 *   evm,
 * } from "@strimz/whisk-react";
 * import "@strimz/whisk-react/styles.css";
 *
 * const config = createWhiskConfig({
 *   wallets: [evm({ projectId: process.env.WALLETCONNECT_PROJECT_ID })],
 *   chains: ["Arc_Testnet", "Base_Sepolia"],
 * });
 *
 * <WhiskProvider config={config}><WhiskSend /></WhiskProvider>
 * ```
 *
 * For headless control (custom UI on top of the engine + state machine),
 * import from `@strimz/whisk-react/headless`.
 */

// Provider
export { WhiskProvider } from "./provider/WhiskProvider.js";
export type { WhiskProviderProps } from "./provider/WhiskProvider.js";

// Config
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

// Components
export {
  WhiskSend,
  SwapTab,
  Button,
  Input,
  Field,
  FieldBox,
  FieldBoxSelect,
  Card,
  Badge,
  ChainPicker,
  StepRail,
  AccountChip,
  NetworkPill,
  Banner,
  BalanceLine,
  ConnectModal,
} from "./components/index.js";
export type {
  WhiskSendProps,
  WhiskSendTab,
  SwapTabProps,
  ButtonProps,
  ButtonVariant,
  ButtonSize,
  InputProps,
  FieldProps,
  FieldBoxProps,
  FieldBoxSelectProps,
  BadgeProps,
  ChainPickerProps,
  StepRailProps,
  BannerProps,
  BalanceLineProps,
  ConnectModalProps,
} from "./components/index.js";

// Resolvers — the default chain (address + ENS) is mounted automatically
// by `WhiskProvider` when the dev doesn't pass a custom `resolver`. The
// individual factories are exposed here so consumers can compose their
// own chain (Lens, Unstoppable, custom email-resolver, etc.).
export {
  ensResolver,
  createEnsResolver,
  defaultResolver,
  createDefaultResolver,
} from "./resolvers/index.js";
export type { EnsResolverOptions } from "./resolvers/index.js";
// Re-export core's address resolver and `composeResolvers` helper so
// host apps don't need a second import to wire a custom chain.
export { addressResolver, composeResolvers } from "@strimz/whisk-core";

// Chain registry helpers — same reason: avoid forcing apps to depend
// on `@strimz/whisk-core` for routine lookups.
export {
  allChains,
  chainInfo,
  chainsByNetwork,
  chainsByKind,
  chainByEvmId,
  supportedTokensFor,
  tokenAddressFor,
} from "@strimz/whisk-core";
export type {
  ChainInfo,
  SupportedTokenAlias,
} from "@strimz/whisk-core";

// Hooks (also exposed in /headless for tree-shake-friendly imports)
export {
  useWhisk,
  useWhiskAdapter,
  useWhiskAccount,
  useWhiskContext,
  useChainBalance,
  useWhiskSwap,
} from "./hooks/index.js";
export type {
  UseWhiskResult,
  WhiskActions,
  UseWhiskAccountResult,
  ChainBalance,
  UseWhiskSwapResult,
  SwapState,
  SwapInput,
} from "./hooks/index.js";

// Convenience re-exports of the most common core types so consumers don't
// need a second import for things like `Chain` or `Quote`.
export type {
  Chain,
  ChainKind,
  ChainNetwork,
  Token,
  Route,
  Step,
  Quote,
  ResolvedRecipient,
  FeePolicy,
  FeeBreakdown,
  Resolver,
  WhiskState,
  WhiskError,
} from "@strimz/whisk-core";
