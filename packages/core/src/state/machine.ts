import type { ResolvedRecipient } from "../types/recipient.js";
import type { Quote } from "../types/quote.js";
import type { Step, StepName } from "../types/step.js";
import type { WhiskState } from "../types/state.js";
import type { WhiskError } from "../errors/errors.js";
import { chainInfo } from "../chains/registry.js";

/** Payload shape for the HYDRATE_FAILED action — narrowed view of a
 *  recovery snapshot. */
export type HydrateFailedPayload = {
  error: WhiskError;
  quote: Quote;
  steps: Step[];
  raw: unknown;
};

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
  | { type: "SEND_FAILURE"; error: WhiskError; raw?: unknown }
  | { type: "RETRY_START" }
  | { type: "HYDRATE_FAILED"; payload: HydrateFailedPayload };

const ALL_BRIDGE_STEPS: StepName[] = [
  "approve",
  "burn",
  "fetchAttestation",
  "mint",
];
const ALL_SEND_STEPS: StepName[] = ["approve", "transfer"];

/**
 * Source-ecosystem variants. Solana doesn't have ERC-20 allowance
 * semantics — the burn instruction is signed directly, so there is
 * no `approve` step. EVM source kept as the default so the existing
 * call signature stays valid for callers that don't pass `sourceKind`.
 */
const SOLANA_BRIDGE_STEPS: StepName[] = ["burn", "fetchAttestation", "mint"];
const SOLANA_SEND_STEPS: StepName[] = ["transfer"];

/**
 * Build the initial step list for a route, all in `pending` state.
 *
 * `sourceKind` lets the machine omit the `approve` step when the
 * source chain doesn't have an ERC-20-style allowance flow. Without
 * this, the StepRail would render "Authorize" forever-pending for
 * Solana bridges (App Kit never fires `bridge.approve` for them),
 * which read as a stuck transfer to users.
 */
export function initialSteps(
  routeKind: "send" | "bridge",
  sourceKind: "evm" | "solana" = "evm",
): Step[] {
  let names: StepName[];
  if (routeKind === "send") {
    names = sourceKind === "solana" ? SOLANA_SEND_STEPS : ALL_SEND_STEPS;
  } else {
    names = sourceKind === "solana" ? SOLANA_BRIDGE_STEPS : ALL_BRIDGE_STEPS;
  }
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
      // Source chain decides whether the approve step exists. EVM
      // bridges have an approve (ERC-20 allowance or EIP-2612 permit);
      // Solana bridges do not (burn instruction is signed directly).
      const route = state.quote.route;
      const sourceChain =
        route.kind === "send" ? route.chain : route.sourceChain;
      const sourceKind = chainInfo(sourceChain).kind;
      const steps = initialSteps(route.kind, sourceKind);
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
        raw: action.raw,
      };

    case "HYDRATE_FAILED": {
      // Resume a prior mid-flight failure from persisted storage.
      // Only valid right after connect (state.kind === "idle") so we
      // don't clobber an in-progress flow with a stale snapshot.
      if (state.kind !== "idle") return state;
      const { error, quote, steps, raw } = action.payload;
      return { kind: "failed", error, quote, steps, raw };
    }

    case "RETRY_START": {
      // Retry only makes sense when we have a bridge failure with the
      // original `raw` result preserved — that's how the engine resumes
      // via `kit.retryBridge`. Anything else: no-op.
      if (state.kind !== "failed") return state;
      if (!state.quote || !state.steps || state.raw === undefined) return state;
      // Re-enter "sending" with the steps we already have. The
      // `currentStep` becomes the first non-success step — typically
      // `mint` when the forwarder failed.
      const nextPending = state.steps.find((s) => s.state !== "success");
      const fallback = state.steps[state.steps.length - 1];
      const currentStep = nextPending?.name ?? fallback?.name;
      if (!currentStep) return state;
      return {
        kind: "sending",
        quote: state.quote,
        steps: state.steps,
        currentStep,
      };
    }

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export const initialState: WhiskState = { kind: "disconnected" };
