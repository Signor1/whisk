import type { AdapterContext } from "@circle-fin/app-kit";
import type { Chain } from "../types/chain.js";

/**
 * App Kit's `Adapter` class isn't exported as a named type. We derive it
 * from the public `AdapterContext` shape so Whisk gets the same type App
 * Kit's `from.adapter` field expects, without forking or duplicating it.
 */
export type AppKitAdapter = AdapterContext["adapter"];
import type { Quote } from "../types/quote.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import type { Step } from "../types/step.js";
import type { WhiskConfig } from "../types/config.js";
import type { WhiskError } from "../errors/errors.js";

/**
 * The wallet adapter Whisk hands to App Kit. Wraps Circle's `Adapter` in a
 * thin shell so the engine can carry chain-kind metadata next to it (used
 * for capability checks and chain-routing decisions) without re-deriving
 * that info from the adapter on every call.
 *
 * Whisk depends on App Kit's `Adapter` type directly here — the trade-off
 * we accept for full type safety in the engine. Devs constructing this
 * adapter use App Kit's own factory functions (`createViemAdapterFromX`,
 * `createSolanaKitAdapterFromX`).
 */
export type WhiskAdapter = {
  /** The underlying App Kit adapter instance. */
  appKitAdapter: AppKitAdapter;
  /** Logical kind — drives validation and capability checks. */
  kind: "evm" | "solana";
  /** Address the adapter signs from. */
  address: string;
};

export type QuoteParams = {
  /** Chain the user is sending from. */
  sourceChain: Chain;
  /** Chain the user is sending to. Equal to `sourceChain` for same-chain. */
  destinationChain: Chain;
  /** Resolved recipient on the destination chain. */
  recipient: ResolvedRecipient;
  /** Amount in human-readable USDC (e.g. `"1.50"`). */
  amount: string;
  /** Adapter that will sign the source-side transaction. */
  adapter: WhiskAdapter;
};

export type SendParams = QuoteParams & {
  /**
   * The quote shown to the user. Whisk re-prices internally before sending
   * but the quote is required so we can guard against drift larger than a
   * configurable tolerance (currently fixed at zero — drift detection lands
   * with v0.2).
   */
  quote: Quote;
};

export type SendStepListener = (step: Step) => void;

export type SendListeners = {
  onStep?: SendStepListener;
};

export type SendSuccess = {
  kind: "success";
  finalTxHash?: string;
  steps: Step[];
};

export type SendFailure = {
  kind: "failure";
  error: WhiskError;
  steps: Step[];
  /**
   * The original App Kit `BridgeResult`, preserved so `retry()` can call
   * `kit.retryBridge` with it. Typed as `unknown` here because the engine's
   * public surface deliberately doesn't pin App Kit's `BridgeResult`
   * interface — `retry()` does the cast internally.
   */
  raw?: unknown;
};

export type SendResult = SendSuccess | SendFailure;

export type RetryParams = {
  failed: SendFailure;
  adapter: WhiskAdapter;
};

/**
 * The single public interface every Whisk frontend (React, Solid, vanilla)
 * talks to. Stateless — each method is self-contained and the engine never
 * holds per-call state. State lives in the consumer (`useReducer` in the
 * React layer, etc.).
 */
export interface WhiskEngine {
  readonly config: WhiskConfig;
  resolve(input: string, chain: Chain): Promise<ResolvedRecipient>;
  quote(params: QuoteParams): Promise<Quote>;
  send(params: SendParams, listeners?: SendListeners): Promise<SendResult>;
  retry(params: RetryParams, listeners?: SendListeners): Promise<SendResult>;
}
