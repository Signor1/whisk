"use client";

import { useCallback, useReducer } from "react";
import {
  toWhiskError,
  type Chain,
  type SwapEstimate,
  type Token,
  type WhiskError,
} from "@usewhisk/core";
import { useWhiskContext } from "./useWhiskContext.js";
import { useWhiskAdapter } from "./useWhiskAdapter.js";

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
  estimate: (input: SwapInput) => Promise<void>;
  swap: () => Promise<void>;
  back: () => void;
  reset: () => void;
};

export function useWhiskSwap(): UseWhiskSwapResult {
  const { engine } = useWhiskContext();
  const [state, dispatch] = useReducer(reduce, initial);

  const lastInputRef = useStableRef<SwapInput | null>(null);

  const sourceChain = lastInputRef.value?.chain;
  const adapter = useWhiskAdapter(sourceChain);

  const estimate = useCallback<UseWhiskSwapResult["estimate"]>(
    async (input) => {
      lastInputRef.value = input;
      dispatch({ type: "ESTIMATE_START" });
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
