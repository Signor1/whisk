import type { AdapterContext } from "@circle-fin/app-kit";
import type { Chain } from "../types/chain.js";
import type { Token } from "../types/token.js";

// Derived from `AdapterContext` since App Kit doesn't export `Adapter` as a named type.
export type AppKitAdapter = AdapterContext["adapter"];
import type { Quote } from "../types/quote.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import type { Step } from "../types/step.js";
import type { WhiskConfig } from "../types/config.js";
import type { WhiskError } from "../errors/errors.js";

export type WhiskAdapter = {
  appKitAdapter: AppKitAdapter;
  kind: "evm" | "solana";
  address: string;
};

export type QuoteParams = {
  sourceChain: Chain;
  destinationChain: Chain;
  recipient: ResolvedRecipient;
  /** Human-readable amount (e.g. `"1.50"`). */
  amount: string;
  adapter: WhiskAdapter;
  /** Bridges always use USDC regardless (App Kit Bridge is USDC-only). */
  token?: Token;
};

export type SendParams = QuoteParams & {
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
  /** Original App Kit `BridgeResult` preserved so `retry()` can call `kit.retryBridge`. */
  raw?: unknown;
};

export type SendResult = SendSuccess | SendFailure;

export type RetryParams = {
  failed: SendFailure;
  adapter: WhiskAdapter;
};

export type SwapParams = {
  chain: Chain;
  tokenIn: Token | string;
  tokenOut: Token | string;
  amountIn: string;
  adapter: WhiskAdapter;
  /** Defaults to 300 (3%). */
  slippageBps?: number;
  /** Minimum `tokenOut` to receive. Takes precedence over `slippageBps`. */
  stopLimit?: string;
  /** Circle Console kit key — required by the swap provider. */
  kitKey: string;
  recipientAddress?: string;
};

export type SwapEstimate = {
  amountIn: string;
  amountOut: string;
  minOutput: string;
  tokenIn: Token | string;
  tokenOut: Token | string;
  fees: {
    total: string;
    entries: Array<{ kind: string; amount: string; token: string }>;
  };
};

export type SwapSuccess = {
  kind: "success";
  txHash?: string;
  explorerUrl?: string;
  amountOut?: string;
};

export type SwapFailure = {
  kind: "failure";
  error: WhiskError;
};

export type SwapResult = SwapSuccess | SwapFailure;

export interface WhiskEngine {
  readonly config: WhiskConfig;
  resolve(input: string, chain: Chain): Promise<ResolvedRecipient>;
  quote(params: QuoteParams): Promise<Quote>;
  send(params: SendParams, listeners?: SendListeners): Promise<SendResult>;
  retry(params: RetryParams, listeners?: SendListeners): Promise<SendResult>;
  estimateSwap(params: SwapParams): Promise<SwapEstimate>;
  swap(params: SwapParams): Promise<SwapResult>;
}
