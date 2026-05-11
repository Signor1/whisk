"use client";

import { useCallback, useReducer } from "react";
import {
  toWhiskError,
  type Chain,
  type SwapEstimate,
  type Token,
  type WhiskError,
} from "@signordev/whisk-core";
import { useWhiskContext } from "./useWhiskContext.js";
import { useWhiskAdapter } from "./useWhiskAdapter.js";

/**
 * State machine for the Swap tab. Mirrors the Transfer machine in spirit
 * (idle → estimating → review → swapping → succeeded / failed) but lives
 * inside this hook because swap state is independent of the global send
 * flow — switching tabs shouldn't blow either state away.
 */
export type SwapState =
  | { kind: "idle" }
  | { kind: "estimating" }
  | { kind: "review"; estimate: SwapEstimate }
  | { kind: "swapping"; estimate: SwapEstimate }
  | {
      kind: "succeeded";
      estimate: SwapEstimate;
      txHash?: string;
      explorerUrl?: string;
      amountOut?: string;
    }
  | { kind: "failed"; error: WhiskError };

type SwapAction =
  | { type: "ESTIMATE_START" }
  | { type: "ESTIMATE_SUCCESS"; estimate: SwapEstimate }
  | { type: "ESTIMATE_FAILURE"; error: WhiskError }
  | { type: "BACK" }
  | { type: "SWAP_START"; estimate: SwapEstimate }
  | {
      type: "SWAP_SUCCESS";
      estimate: SwapEstimate;
      txHash?: string;
      explorerUrl?: string;
      amountOut?: string;
    }
  | { type: "SWAP_FAILURE"; error: WhiskError }
  | { type: "RESET" };

const initial: SwapState = { kind: "idle" };

function reduce(state: SwapState, action: SwapAction): SwapState {
  switch (action.type) {
    case "ESTIMATE_START":
      return { kind: "estimating" };
    case "ESTIMATE_SUCCESS":
      return { kind: "review", estimate: action.estimate };
    case "ESTIMATE_FAILURE":
      return { kind: "failed", error: action.error };
    case "BACK":
      return { kind: "idle" };
    case "SWAP_START":
      return { kind: "swapping", estimate: action.estimate };
    case "SWAP_SUCCESS":
      return {
        kind: "succeeded",
        estimate: action.estimate,
        txHash: action.txHash,
        explorerUrl: action.explorerUrl,
        amountOut: action.amountOut,
      };
    case "SWAP_FAILURE":
      return { kind: "failed", error: action.error };
    case "RESET":
      return initial;
    default: {
      const _: never = action;
      return state;
    }
  }
}

export type SwapInput = {
  chain: Chain;
  tokenIn: Token | string;
  tokenOut: Token | string;
  amountIn: string;
  kitKey: string;
  slippageBps?: number;
  stopLimit?: string;
};

export type UseWhiskSwapResult = {
  state: SwapState;
  /** Build a quote and move to the review step. */
  estimate: (input: SwapInput) => Promise<void>;
  /** Execute the swap currently in `review`. */
  swap: () => Promise<void>;
  /** Go back from review to idle. */
  back: () => void;
  /** Clear state — used after success/failure. */
  reset: () => void;
};

/**
 * Headless hook for Swap. Mirrors `useWhisk()` for transfers — both can
 * coexist in the same widget and share the same `WhiskAdapter` (they just
 * happen to call different App Kit endpoints).
 *
 * The Tabs UI uses this for the Swap tab content while `useWhisk()` drives
 * the Transfer tab.
 */
export function useWhiskSwap(): UseWhiskSwapResult {
  const { engine } = useWhiskContext();
  const [state, dispatch] = useReducer(reduce, initial);

  // The active chain comes from the most recent `estimate()` call. We
  // build the adapter against it because swaps are same-chain — no need
  // to track source/destination separately.
  const lastInputRef = useStableRef<SwapInput | null>(null);

  // Pull adapter for the chain from the last estimate input (or
  // undefined on first render — quote will set it).
  const sourceChain = lastInputRef.value?.chain;
  const adapter = useWhiskAdapter(sourceChain);

  const estimate = useCallback<UseWhiskSwapResult["estimate"]>(
    async (input) => {
      lastInputRef.value = input;
      dispatch({ type: "ESTIMATE_START" });
      // We may have just set the chain for the first time — give the
      // adapter hook a tick to rebuild before we ask for a quote, since
      // `adapter` from the closure is captured at hook-call time.
      // In practice React re-runs this callback after rerender so the
      // captured `adapter` is current; only fully-new chain choices
      // need the soft "click again" fallback handled at the UI layer.
      try {
        if (!adapter) {
          throw new Error(
            "Wallet not ready for the selected chain. Try again in a moment.",
          );
        }
        const result = await engine.estimateSwap({
          chain: input.chain,
          tokenIn: input.tokenIn,
          tokenOut: input.tokenOut,
          amountIn: input.amountIn,
          kitKey: input.kitKey,
          slippageBps: input.slippageBps,
          stopLimit: input.stopLimit,
          adapter,
        });
        dispatch({ type: "ESTIMATE_SUCCESS", estimate: result });
      } catch (err) {
        dispatch({
          type: "ESTIMATE_FAILURE",
          error: toWhiskError(err, "Swap estimate failed"),
        });
      }
    },
    [adapter, engine, lastInputRef],
  );

  const swap = useCallback<UseWhiskSwapResult["swap"]>(async () => {
    if (state.kind !== "review") return;
    if (!adapter) return;
    const input = lastInputRef.value;
    if (!input) return;
    const e = state.estimate;
    dispatch({ type: "SWAP_START", estimate: e });
    try {
      const result = await engine.swap({
        chain: input.chain,
        tokenIn: input.tokenIn,
        tokenOut: input.tokenOut,
        amountIn: input.amountIn,
        kitKey: input.kitKey,
        slippageBps: input.slippageBps,
        stopLimit: input.stopLimit,
        adapter,
      });
      if (result.kind === "success") {
        dispatch({
          type: "SWAP_SUCCESS",
          estimate: e,
          txHash: result.txHash,
          explorerUrl: result.explorerUrl,
          amountOut: result.amountOut,
        });
      } else {
        dispatch({ type: "SWAP_FAILURE", error: result.error });
      }
    } catch (err) {
      dispatch({
        type: "SWAP_FAILURE",
        error: toWhiskError(err, "Swap failed"),
      });
    }
  }, [adapter, engine, lastInputRef, state]);

  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, estimate, swap, back, reset };
}

/**
 * `useState`-free mutable holder. Same lifetime as the component, no
 * re-render on write. Used here so the swap callbacks can read the
 * latest input without the caller having to keep `useState` mirrored.
 */
function useStableRef<T>(initial: T): { value: T } {
  const [box] = useReducer(
    (s: { value: T }, next: T) => {
      s.value = next;
      return s;
    },
    { value: initial },
  );
  return box;
}
