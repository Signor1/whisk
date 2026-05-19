import type { ResolvedRecipient } from "./recipient.js";
import type { Quote } from "./quote.js";
import type { Step } from "./step.js";
import type { WhiskError } from "../errors/errors.js";

/**
 * The widget's externally-visible state machine. Every UI surface (drop-in,
 * modal, headless) renders off this single discriminated union.
 *
 * Transitions are deterministic — given a state and an action, the next
 * state is fixed. See `state/machine.ts` for the transition table.
 */
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
      /**
       * Original App Kit `BridgeResult`, preserved when a bridge fails
       * after the burn step succeeded. Lets `actions.retry()` resume
       * via `kit.retryBridge` instead of re-burning. Carried as
       * `unknown` to keep the React-facing types decoupled from App
       * Kit; the engine narrows it internally.
       */
      raw?: unknown;
    };

export type WhiskStateKind = WhiskState["kind"];
