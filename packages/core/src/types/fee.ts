import type { Token } from "./token.js";

/**
 * A custom fee the host application collects on top of every Whisk send.
 *
 * Per Circle's App Kit policy, Arc receives 10% of the value collected here
 * and the configured `recipient` receives 90%. The widget surfaces this
 * split transparently in the review step so end users see exactly where
 * each part of the fee goes.
 */
export type FeePolicy = {
  /**
   * Absolute USDC amount added on top of the transfer (Send and Bridge).
   * Mutually exclusive with `bps`.
   */
  value?: string;
  /**
   * Basis points to charge on the swap amount (Swap only — used in v2).
   * 100 bps = 1%. Mutually exclusive with `value`.
   */
  bps?: number;
  /** Address that receives the host's 90% share. */
  recipient: string;
};

export type FeeEntryKind =
  /** Custom fee defined by the host app. */
  | "custom"
  /** Provider/protocol fee charged by the underlying SDK (CCTP / Gateway). */
  | "protocol"
  /** Network gas paid by the source wallet. */
  | "gas"
  /** Circle Forwarding Service fee, deducted from the destination mint. */
  | "forwarder"
  /** DEX/Swap aggregator fee. */
  | "provider";

export type FeeEntry = {
  kind: FeeEntryKind;
  amount: string;
  token: Token | "NATIVE";
  /** Optional recipient (only set on custom fees and certain protocol fees). */
  recipient?: string;
  /** Free-form description — surfaced in the UI. */
  description?: string;
};

export type FeeBreakdown = {
  /** Sum of all fee entries denominated in `token`. */
  total: string;
  token: Token;
  entries: FeeEntry[];
};
