"use client";

import { useCallback, useReducer } from "react";
import {
  initialState,
  reduce,
  toWhiskError,
  type Chain,
  type ResolvedRecipient,
  type Step,
  type WhiskAction,
  type WhiskState,
} from "@strimz/whisk-core";
import { useWhiskContext } from "./useWhiskContext.js";
import { useWhiskAdapter } from "./useWhiskAdapter.js";

/**
 * Headless hook that exposes Whisk's full state machine + actions. Drop-in
 * components (`<WhiskSend>`, `<WhiskSendModal>`) render off the same hook
 * — there's no separate "internal" API.
 *
 * Actions are stable callbacks: they read the latest state via the
 * reducer's closure and dispatch into it, so consumers can pass them
 * directly to event handlers without `useCallback` gymnastics.
 */
export type WhiskActions = {
  /** Resolve a free-text recipient (address, ENS, …). */
  resolve: (input: string, chain: Chain) => Promise<void>;
  /** Build a quote for the resolved recipient + amount. */
  quote: (recipient: ResolvedRecipient, amount: string) => Promise<void>;
  /** Go back to the input step from review. */
  back: () => void;
  /** Execute the send/bridge currently in `review` state. */
  send: () => Promise<void>;
  /** Reset the wizard to the idle state. */
  reset: () => void;
};

export type UseWhiskResult = {
  state: WhiskState;
  actions: WhiskActions;
  /** Whether a wallet is connected. Drives the connect-CTA in UIs. */
  connected: boolean;
  /** The address of the connected wallet, or undefined. */
  address: string | undefined;
};

/**
 * The headless API. Consumed both by the drop-in components and by host
 * apps that want to render their own UI on top of Whisk's state machine.
 */
export function useWhisk(): UseWhiskResult {
  const { engine, config } = useWhiskContext();
  const adapter = useWhiskAdapter();
  const [state, dispatch] = useReducer(reduce, initialState);

  // Sync the connect/disconnect transitions with the wagmi adapter so the
  // state machine never sees stale `disconnected` / `idle` values.
  // The reducer is idempotent for these transitions.
  if (adapter && state.kind === "disconnected") {
    dispatch({ type: "CONNECTED" });
  }
  if (!adapter && state.kind !== "disconnected") {
    dispatch({ type: "DISCONNECTED" });
  }

  const resolve = useCallback<WhiskActions["resolve"]>(
    async (input, chain) => {
      dispatch({ type: "RESOLVE_START", input });
      try {
        const recipient = await engine.resolve(input, chain);
        dispatch({ type: "RESOLVE_SUCCESS", recipient });
      } catch (err) {
        dispatch({ type: "RESOLVE_FAILURE", error: toWhiskError(err) });
      }
    },
    [engine],
  );

  const quote = useCallback<WhiskActions["quote"]>(
    async (recipient, amount) => {
      if (!adapter) return;
      dispatch({ type: "QUOTE_START", recipient, amount });
      try {
        const quote = await engine.quote({
          sourceChain:
            config.defaultSourceChain ?? config.chains[0]!,
          destinationChain: recipient.chain,
          recipient,
          amount,
          adapter,
        });
        dispatch({ type: "QUOTE_SUCCESS", quote });
      } catch (err) {
        dispatch({ type: "QUOTE_FAILURE", error: toWhiskError(err) });
      }
    },
    [adapter, engine, config.chains, config.defaultSourceChain],
  );

  const back = useCallback<WhiskActions["back"]>(() => {
    dispatch({ type: "REVIEW_BACK" });
  }, []);

  const send = useCallback<WhiskActions["send"]>(async () => {
    if (state.kind !== "review" || !adapter) return;
    const quote = state.quote;
    dispatch({ type: "SEND_START" });
    const onStep = (step: Step) => dispatch({ type: "STEP_UPDATE", step });
    try {
      const result = await engine.send(
        {
          sourceChain: quote.route.kind === "send"
            ? quote.route.chain
            : quote.route.sourceChain,
          destinationChain: quote.route.kind === "send"
            ? quote.route.chain
            : quote.route.destinationChain,
          recipient: quote.recipient,
          amount: quote.amountOut,
          adapter,
          quote,
        },
        { onStep },
      );
      if (result.kind === "success") {
        dispatch({
          type: "SEND_SUCCESS",
          finalTxHash: result.finalTxHash,
        });
      } else {
        dispatch({ type: "SEND_FAILURE", error: result.error });
      }
    } catch (err) {
      dispatch({ type: "SEND_FAILURE", error: toWhiskError(err) });
    }
  }, [adapter, engine, state]);

  const reset = useCallback<WhiskActions["reset"]>(() => {
    dispatch({ type: "RESET" });
  }, []);

  const actions: WhiskActions = { resolve, quote, back, send, reset };

  return {
    state,
    actions,
    connected: Boolean(adapter),
    address: adapter?.address,
  };
}

// Re-export the action union for advanced consumers that want to dispatch
// directly into the reducer (e.g. integration tests).
export type { WhiskAction };
