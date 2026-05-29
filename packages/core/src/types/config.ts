import type { Chain, ChainNetwork } from "./chain.js";
import type { Token } from "./token.js";
import type { FeePolicy, FeeBearer } from "./fee.js";
import type { Resolver } from "./resolver.js";

export type WhiskMode = ChainNetwork;

export type WhiskConfig = {
  chains: Chain[];

  defaultSourceChain?: Chain;

  defaultDestinationChain?: Chain;

  token?: Token;

  resolver?: Resolver;

  feePolicy?: FeePolicy;

  /** Who absorbs the bridge fees. Defaults to `"receiver"`. See {@link FeeBearer}. */
  feeBearer?: FeeBearer;

  /**
   * Override App Kit's public RPC endpoints. Pass an array to install a
   * viem `fallback` transport that re-ranks by latency.
   */
  rpcUrls?: Partial<Record<Chain, string | string[]>>;

  /**
   * Use Circle's Forwarding Service to submit the destination mint on
   * cross-chain bridges. Default `true`. Cross-ecosystem bridges
   * (Solana ↔ EVM) always use the forwarder regardless.
   */
  useForwarder?: boolean;

  /** Inferred from `chains` when omitted. Mixed networks default to `"testnet"` with a warning. */
  mode?: WhiskMode;

  appLabel?: string;
};
