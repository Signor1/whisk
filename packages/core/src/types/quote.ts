import type { ResolvedRecipient } from "./recipient.js";
import type { Route } from "./route.js";
import type { FeeBreakdown } from "./fee.js";
import type { Token } from "./token.js";

export type Quote = {
  route: Route;
  recipient: ResolvedRecipient;
  amountIn: string;
  amountOut: string;
  token: Token;
  fees: FeeBreakdown;
  estimatedDurationMs?: number;
};
