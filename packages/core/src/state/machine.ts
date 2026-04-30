import type { ResolvedRecipient } from "../types/recipient.js";
import type { Quote } from "../types/quote.js";
import type { Step, StepName } from "../types/step.js";
import type { WhiskState } from "../types/state.js";
import type { WhiskError } from "../errors/errors.js";

/**
 * Discrete actions the UI dispatches to the state machine. Every action is
 * a plain object so listings render cleanly in devtools and so React's
 * `useReducer` can take this set as-is.
 */
export type WhiskAction =
  | { type: "CONNECTED" }
  | { type: "DISCONNECTED" }
  | { type: "RESET" }
  | { type: "RESOLVE_START"; input: string }
  | { type: "RESOLVE_SUCCESS"; recipient: ResolvedRecipient }
  | { type: "RESOLVE_FAILURE"; error: WhiskError }
  | { type: "QUOTE_START"; recipient: ResolvedRecipient; amount: string }
  | { type: "QUOTE_SUCCESS"; quote: Quote }
  | { type: "QUOTE_FAILURE"; error: WhiskError }
  | { type: "REVIEW_BACK" }
  | { type: "SEND_START" }
  | { type: "STEP_UPDATE"; step: Step }
  | { type: "SEND_SUCCESS"; finalTxHash?: string }
  | { type: "SEND_FAILURE"; error: WhiskError };

const ALL_BRIDGE_STEPS: StepName[] = [
  "approve",
  "burn",
  "fetchAttestation",
  "mint",
];
const ALL_SEND_STEPS: StepName[] = ["approve", "transfer"];

/** Build the initial step list for a route, all in `pending` state. */
export function initialSteps(routeKind: "send" | "bridge"): Step[] {
  const names = routeKind === "send" ? ALL_SEND_STEPS : ALL_BRIDGE_STEPS;
  return names.map((name) => ({ name, state: "pending" }));
}

/**
 * Pure reducer. Every transition is explicit so the matrix of valid
 * (state, action) pairs is auditable in one file.
 *
 * Invalid transitions return the current state unchanged rather than
 * throwing — UI buttons that should be disabled at a given state simply
 * never reach this code, but defensive no-ops protect against double
 * clicks and stale dispatches.
 */
export function reduce(state: WhiskState, action: WhiskAction): WhiskState {
  switch (action.type) {
    case "CONNECTED":
      return state.kind === "disconnected" ? { kind: "idle" } : state;

    case "DISCONNECTED":
      return { kind: "disconnected" };

    case "RESET":
      return state.kind === "disconnected" ? state : { kind: "idle" };

    case "RESOLVE_START":
      if (state.kind !== "idle" && state.kind !== "resolved") return state;
      return { kind: "resolving", input: action.input };

    case "RESOLVE_SUCCESS":
      if (state.kind !== "resolving") return state;
      return { kind: "resolved", recipient: action.recipient };

    case "RESOLVE_FAILURE":
      if (state.kind !== "resolving") return state;
      return { kind: "failed", error: action.error };

    case "QUOTE_START":
      if (state.kind !== "resolved" && state.kind !== "review") return state;
      return {
        kind: "quoting",
        recipient: action.recipient,
        amount: action.amount,
      };

    case "QUOTE_SUCCESS":
      if (state.kind !== "quoting") return state;
      return { kind: "review", quote: action.quote };

    case "QUOTE_FAILURE":
      if (state.kind !== "quoting") return state;
      return { kind: "failed", error: action.error };

    case "REVIEW_BACK":
      if (state.kind !== "review") return state;
      return { kind: "resolved", recipient: state.quote.recipient };

    case "SEND_START": {
      if (state.kind !== "review") return state;
      const steps = initialSteps(state.quote.route.kind);
      const first = steps[0];
      if (!first) return state;
      return {
        kind: "sending",
        quote: state.quote,
        steps,
        currentStep: first.name,
      };
    }

    case "STEP_UPDATE": {
      if (state.kind !== "sending") return state;
      const steps = state.steps.map((s) =>
        s.name === action.step.name ? { ...s, ...action.step } : s,
      );
      // Advance `currentStep` to the next pending step if any.
      const nextPending = steps.find((s) => s.state === "pending");
      return {
        ...state,
        steps,
        currentStep: nextPending?.name ?? state.currentStep,
      };
    }

    case "SEND_SUCCESS":
      if (state.kind !== "sending") return state;
      return {
        kind: "succeeded",
        quote: state.quote,
        steps: state.steps,
        finalTxHash: action.finalTxHash,
      };

    case "SEND_FAILURE":
      if (state.kind !== "sending") return state;
      return {
        kind: "failed",
        error: action.error,
        quote: state.quote,
        steps: state.steps,
      };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export const initialState: WhiskState = { kind: "disconnected" };
