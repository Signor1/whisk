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
