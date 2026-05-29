import type { Token } from "./token.js";

/**
 * Custom fee collected on top of every Whisk send. Per Circle App Kit
 * policy, Arc receives 10% and `recipient` receives 90%.
 */
export type FeePolicy = {
  /** Absolute USDC amount. Mutually exclusive with `bps`. */
  value?: string;
  /** Basis points on the swap amount (Swap only — v2). Mutually exclusive with `value`. */
  bps?: number;
  recipient: string;
};

export type FeeEntryKind =
  | "custom"
  | "protocol"
  | "gas"
  | "forwarder"
  | "provider";

/**
 * Who absorbs the CCTP protocol + Forwarding Service fees on a bridge.
 *
 * - `"receiver"` (default): fees are deducted from the bridged amount, so the
 *   recipient nets `amount − fees`. The sender's debit equals `amount`.
 * - `"sender"`: the burn is sized up by the estimated fees so the recipient
 *   receives the full `amount`. The sender's debit grows to cover the fees.
 *   Because fees are estimated at quote time, the delivered amount can differ
 *   by a few cents if destination gas shifts before the mint lands.
 */
export type FeeBearer = "sender" | "receiver";

export type FeeEntry = {
  kind: FeeEntryKind;
  amount: string;
  token: Token | "NATIVE";
  recipient?: string;
  description?: string;
};

export type FeeBreakdown = {
  total: string;
  token: Token;
  entries: FeeEntry[];
};
