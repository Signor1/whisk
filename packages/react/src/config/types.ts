import type {
  Chain,
  FeePolicy,
  Resolver,
  Token,
  WhiskMode,
} from "@signordev/whisk-core";

/**
 * Discriminator on the wallet-adapter factories that `createWhiskConfig`
 * accepts. Each kind of adapter brings its own peer dependencies (wagmi
 * connectors for EVM, Solana wallet adapter for Solana). Apps that don't
 * import a given factory don't pay for its bundle weight.
 */
export type WalletAdapterFactory = EvmAdapterFactory | SolanaAdapterFactory;

/**
 * Result returned by the `evm()` factory. Contains the wagmi config the
 * provider mounts, plus a logical kind for capability checks at runtime.
 *
 * The actual wagmi `Config` object is held opaque to avoid leaking wagmi's
 * type signatures through Whisk's public surface — the React layer
 * narrows it where needed.
 */
export type EvmAdapterFactory = {
  kind: "evm";
  /** Opaque wagmi `Config` — passed to `WagmiProvider`. */
  config: unknown;
};

export type SolanaAdapterFactory = {
  kind: "solana";
  /**
   * Reserved for the Solana adapter shape. Stubbed in v0.1; the React
   * layer currently rejects this factory at runtime with a clear "coming
   * in v0.2" error so we don't ship a half-working code path.
   */
  config?: unknown;
};

/**
 * The fully-resolved configuration the WhiskProvider consumes. Devs get
 * here by calling `createWhiskConfig(...)`.
 *
 * Splitting "user input" from "resolved config" keeps the public factory
 * surface small while letting the provider attach defaults (token,
 * resolver fallback, etc.) without surprising callers.
 */
export type WhiskClientConfig = {
  wallets: WalletAdapterFactory[];
  chains: Chain[];
  defaultSourceChain?: Chain;
  defaultDestinationChain?: Chain;
  token?: Token;
  resolver?: Resolver;
  feePolicy?: FeePolicy;
  rpcUrls?: Partial<Record<Chain, string | string[]>>;
  useForwarder?: boolean;
  /**
   * Operational mode — `"testnet"` (default for testnet chain lists)
   * or `"mainnet"`. Inferred from `chains` when omitted. Drives the
   * visible mode pill on the widget, the default ENS resolver
   * composition (Sepolia → mainnet fallback on testnet vs mainnet-only
   * on mainnet), and persistence storage-key namespacing so testnet
   * recovery snapshots don't surface in a mainnet config.
   */
  mode?: WhiskMode;
  appLabel?: string;
};

/**
 * The single bag of options the host app passes to `createWhiskConfig`.
 * Identical shape to `WhiskClientConfig` for now — kept separate so we
 * can add provider-only fields (e.g. WalletConnect projectId, theme
 * overrides) later without breaking the public API.
 */
export type CreateWhiskConfigOptions = WhiskClientConfig;
