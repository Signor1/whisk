import type { Chain, ChainNetwork } from "./chain.js";
import type { Token } from "./token.js";
import type { FeePolicy } from "./fee.js";
import type { Resolver } from "./resolver.js";

/**
 * The operational mode of a Whisk instance. Mirrors `ChainNetwork` so
 * the type is a single source of truth — "mode" is the user-facing
 * label, "network" is the chain-level label.
 *
 * Drives:
 *  - Visible mode indicator on the widget (subtle "Testnet" pill).
 *  - Default resolver chain composition — testnet apps query Sepolia
 *    ENS first, then fall back to mainnet ENS; mainnet apps query
 *    mainnet only.
 *  - Persistence storage key namespacing — testnet snapshots can't
 *    resurrect in a mainnet config.
 */
export type WhiskMode = ChainNetwork;

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
   *
   * Pass a single URL string to replace the default; pass an array of
   * URLs to install a viem `fallback` transport that tries them in
   * order, re-ranking by latency. A stuck or rate-limited primary
   * RPC then transparently flips to the next.
   */
  rpcUrls?: Partial<Record<Chain, string | string[]>>;

  /**
   * Use Circle's Forwarding Service to submit the destination mint on
   * cross-chain bridges.
   *
   * Default: `true`. With the forwarder on, the user signs only the
   * source-side burn — Circle's Iris service fetches the attestation
   * and submits the destination mint. No wallet chain switch, no
   * second signature, much smoother UX in browser wallets. A small
   * forwarding fee is deducted from the destination mint amount and
   * surfaced in the fee breakdown.
   *
   * Set to `false` to keep the destination mint as a user-signed
   * transaction (saves the forwarding fee but requires the user to
   * approve a chain switch + a second signature).
   *
   * Cross-ecosystem bridges (e.g. Solana ↔ EVM) ignore this flag and
   * always use the forwarder, since the source-side adapter can't
   * sign on the destination ecosystem anyway.
   */
  useForwarder?: boolean;

  /**
   * Operational mode — `"testnet"` (default for testnet chain lists)
   * or `"mainnet"`. Inferred from `chains` when omitted: all-testnet
   * chains → `"testnet"`, all-mainnet chains → `"mainnet"`, mixed →
   * `"testnet"` with a console warning (mixed configs are almost
   * always a mistake).
   *
   * Drives the visible mode indicator on the widget, the default ENS
   * resolver composition (Sepolia → mainnet fallback on testnet vs
   * mainnet-only on mainnet), and persistence namespacing so testnet
   * recovery snapshots don't resurrect in a mainnet config.
   */
  mode?: WhiskMode;

  /**
   * Free-text label baked into telemetry payloads — useful when many of
   * your apps embed the same Whisk install and you want to tell them apart
   * in logs.
   */
  appLabel?: string;
};
