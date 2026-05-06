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
} from "./components/index.js";
export type {
  WhiskSendProps,
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
} from "./components/index.js";

// Hooks (also exposed in /headless for tree-shake-friendly imports)
export {
  useWhisk,
  useWhiskAdapter,
  useWhiskAccount,
  useWhiskContext,
  useChainBalance,
} from "./hooks/index.js";
export type {
  UseWhiskResult,
  WhiskActions,
  UseWhiskAccountResult,
  ChainBalance,
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
