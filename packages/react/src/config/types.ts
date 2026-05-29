import type {
  Chain,
  FeePolicy,
  FeeBearer,
  Resolver,
  Token,
  WhiskMode,
} from "@usewhisk/core";

export type WalletAdapterFactory = EvmAdapterFactory | SolanaAdapterFactory;

export type EvmAdapterFactory = {
  kind: "evm";
  /** Opaque wagmi `Config` — passed to `WagmiProvider`. */
  config: unknown;
};

export type SolanaAdapterFactory = {
  kind: "solana";
  config?: unknown;
};

export type WhiskClientConfig = {
  wallets: WalletAdapterFactory[];
  chains: Chain[];
  defaultSourceChain?: Chain;
  defaultDestinationChain?: Chain;
  token?: Token;
  resolver?: Resolver;
  feePolicy?: FeePolicy;
  /** Who pays bridge fees. Default `"receiver"`. Set `"sender"` so the recipient receives the full amount. */
  feeBearer?: FeeBearer;
  rpcUrls?: Partial<Record<Chain, string | string[]>>;
  useForwarder?: boolean;
  /** Inferred from `chains` when omitted. */
  mode?: WhiskMode;
  appLabel?: string;
};

export type CreateWhiskConfigOptions = WhiskClientConfig;
