import type { Chain } from "./chain.js";
import type { Token } from "./token.js";
import type { FeePolicy } from "./fee.js";
import type { Resolver } from "./resolver.js";

/**
 * Everything the host application configures when creating a Whisk engine.
 * Most fields are optional — sensible defaults cover ~80% of use cases.
 */
export type WhiskConfig = {
  /**
   * Chains the widget allows the user to send from / to. Order is preserved
   * in the chain picker UI.
   */
  chains: Chain[];

  /**
   * Default chain selected when the widget mounts. Falls back to the first
   * entry of `chains` if not set.
   */
  defaultSourceChain?: Chain;

  /**
   * Pre-selected destination chain. If omitted the user picks (or it equals
   * source for same-chain sends).
   */
  defaultDestinationChain?: Chain;

  /**
   * Token Whisk transfers. Only `"USDC"` is wired in v1 — the field exists
   * so EURC/USDT support is a non-breaking addition later.
   */
  token?: Token;

  /**
   * Recipient resolver chain. The widget asks each resolver in order until
   * one returns a `ResolvedRecipient`. If absent, only raw addresses work.
   */
  resolver?: Resolver;

  /**
   * Fee policy applied to every send. The host's recipient address gets 90%
   * of whatever is collected here; Arc receives the remaining 10%.
   */
  feePolicy?: FeePolicy;

  /**
   * Override the public RPC endpoints baked into App Kit. Strongly
   * recommended for production — the defaults are shared and rate-limited.
   */
  rpcUrls?: Partial<Record<Chain, string>>;

  /**
   * Use Circle's Forwarding Service to submit the destination mint on
   * cross-chain bridges. Required when the host has no wallet on the
   * destination chain. Default: `false`.
   */
  useForwarder?: boolean;

  /**
   * Free-text label baked into telemetry payloads — useful when many of
   * your apps embed the same Whisk install and you want to tell them apart
   * in logs.
   */
  appLabel?: string;
};
