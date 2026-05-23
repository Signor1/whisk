import type { ResolvedRecipient } from "./recipient.js";
import type { Quote } from "./quote.js";
import type { Step } from "./step.js";
import type { WhiskError } from "../errors/errors.js";

export type WhiskState =
  | { kind: "disconnected" }
  | { kind: "idle" }
  | { kind: "resolving"; input: string }
  | { kind: "resolved"; recipient: ResolvedRecipient }
  | { kind: "quoting"; recipient: ResolvedRecipient; amount: string }
  | { kind: "review"; quote: Quote }
  | {
      kind: "sending";
      quote: Quote;
      steps: Step[];
      currentStep: Step["name"];
    }
  | {
      kind: "succeeded";
      quote: Quote;
      steps: Step[];
      finalTxHash?: string;
    }
  | {
      kind: "failed";
      error: WhiskError;
      quote?: Quote;
      steps?: Step[];
      /** Original App Kit `BridgeResult`; lets `retry()` resume via `kit.retryBridge` instead of re-burning. */
      raw?: unknown;
    };

export type WhiskStateKind = WhiskState["kind"];
