import type { ResolvedRecipient } from "./recipient.js";
import type { Route } from "./route.js";
import type { FeeBreakdown } from "./fee.js";
import type { Token } from "./token.js";

/**
 * The result of a quote — what the user sees on the review step before they
 * confirm. Matches the structure of App Kit's estimate APIs but normalised
 * across `send` and `bridge`.
 */
export type Quote = {
  route: Route;
  recipient: ResolvedRecipient;
  /** Amount the sender is debited (transfer + custom fee). */
  amountIn: string;
  /** Amount the recipient receives at the destination after all fees. */
  amountOut: string;
  /** Token sent and received (must match — Whisk does not swap in v1). */
  token: Token;
  /** Itemised fee breakdown shown in the UI. */
  fees: FeeBreakdown;
  /** Best-effort estimate of how long the transfer will take. */
  estimatedDurationMs?: number;
};
