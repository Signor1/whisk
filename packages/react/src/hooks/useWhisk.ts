"use client";

import { useCallback, useReducer, useState } from "react";
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
import { useWhiskAccount } from "./useWhiskAccount.js";

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
  quote: (
    recipient: ResolvedRecipient,
    amount: string,
    sourceChain: Chain,
  ) => Promise<void>;
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
  /** Whether ANY wallet (EVM or Solana) is connected. */
  connected: boolean;
  /** Address of the currently primary wallet, if any. */
  address: string | undefined;
};

/**
 * The headless API. Consumes both EVM and Solana account state through
 * `useWhiskAccount`, picking the correct adapter for the active source
 * chain at quote / send time.
 */
export function useWhisk(): UseWhiskResult {
  const { engine, config } = useWhiskContext();
  const account = useWhiskAccount();
  const [state, dispatch] = useReducer(reduce, initialState);

  // Track the source chain the consumer is operating on so the adapter
  // hook knows which ecosystem to bridge. This is set the first time
  // `quote()` is called; before then the adapter hook has no source
  // and returns null.
  const [activeSource, setActiveSource] = useState<Chain | undefined>(
    config.defaultSourceChain ?? config.chains[0],
  );

  const adapter = useWhiskAdapter(activeSource);

  // Sync connect / disconnect transitions with the state machine.
  // The reducer is idempotent so re-firing these is safe.
  const connected = Boolean(account.primary?.isConnected);
  if (connected && state.kind === "disconnected") {
    dispatch({ type: "CONNECTED" });
  }
  if (!connected && state.kind !== "disconnected") {
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
    async (recipient, amount, sourceChain) => {
      setActiveSource(sourceChain);
      const adapterForSource = adapter; // captured reference; React ensures
      // we re-render once the new adapter is built, so a quote attempt
      // that arrives during the transition no-ops cleanly.
      if (!adapterForSource) return;
      dispatch({ type: "QUOTE_START", recipient, amount });
      try {
        const result = await engine.quote({
          sourceChain,
          destinationChain: recipient.chain,
          recipient,
          amount,
          adapter: adapterForSource,
        });
        dispatch({ type: "QUOTE_SUCCESS", quote: result });
      } catch (err) {
        dispatch({ type: "QUOTE_FAILURE", error: toWhiskError(err) });
      }
    },
    [adapter, engine],
  );

  const back = useCallback<WhiskActions["back"]>(() => {
    dispatch({ type: "REVIEW_BACK" });
  }, []);

  const send = useCallback<WhiskActions["send"]>(async () => {
    if (state.kind !== "review" || !adapter) return;
    const q = state.quote;
    dispatch({ type: "SEND_START" });
    const onStep = (step: Step) => dispatch({ type: "STEP_UPDATE", step });
    try {
      const result = await engine.send(
        {
          sourceChain:
            q.route.kind === "send" ? q.route.chain : q.route.sourceChain,
          destinationChain:
            q.route.kind === "send" ? q.route.chain : q.route.destinationChain,
          recipient: q.recipient,
          amount: q.amountOut,
          adapter,
          quote: q,
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
    connected,
    address: account.primary?.address,
  };
}

export type { WhiskAction };
