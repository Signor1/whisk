"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  clearInflight,
  deserializeError,
  initialState,
  loadInflight,
  reduce,
  saveInflight,
  serializeError,
  toWhiskError,
  type Chain,
  type ResolvedRecipient,
  type Step,
  type Token,
  type WalletKind,
  type WhiskAction,
  type WhiskState,
} from "@usewhisk/core";
import { useWhiskContext } from "./useWhiskContext.js";
import { useWhiskAdapter } from "./useWhiskAdapter.js";
import { useWhiskAccount } from "./useWhiskAccount.js";

export type WhiskActions = {
  resolve: (input: string, chain: Chain) => Promise<void>;
  quote: (
    recipient: ResolvedRecipient,
    amount: string,
    sourceChain: Chain,
    token?: Token,
  ) => Promise<void>;
  back: () => void;
  send: () => Promise<void>;
  /** Resume a mid-flight bridge failure. Only valid when `raw` is preserved on `failed`. */
  retry: () => Promise<void>;
  reset: () => void;
};

export type UseWhiskResult = {
  state: WhiskState;
  actions: WhiskActions;
  connected: boolean;
  address: string | undefined;
};

export function useWhisk(): UseWhiskResult {
  const { engine, config } = useWhiskContext();
  const mode = engine.config.mode ?? "testnet";
  const account = useWhiskAccount();
  const [state, dispatch] = useReducer(reduce, initialState);

  const [activeSource, setActiveSource] = useState<Chain | undefined>(
    config.defaultSourceChain ?? config.chains[0],
  );

  const adapter = useWhiskAdapter(activeSource);

  const connected = Boolean(account.primary?.isConnected);
  if (connected && state.kind === "disconnected") {
    dispatch({ type: "CONNECTED" });
  }
  if (!connected && state.kind !== "disconnected") {
    dispatch({ type: "DISCONNECTED" });
  }

  // Hydrate mid-flight failure (burn ok, mint pending) from localStorage on fresh mount.
  // Only fires from `idle` so an active flow is never clobbered.
  const hydratedKeyRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!adapter) return;
    if (!activeSource) return;
    if (state.kind !== "idle") return;

    const key = `${mode}:${adapter.kind}:${adapter.address}:${activeSource}`;
    if (hydratedKeyRef.current === key) return;
    hydratedKeyRef.current = key;

    const snapshot = loadInflight(
      mode,
      adapter.kind as WalletKind,
      adapter.address,
      activeSource,
    );
    if (!snapshot) return;

    dispatch({
      type: "HYDRATE_FAILED",
      payload: {
        error: deserializeError(snapshot.error),
        quote: snapshot.quote,
        steps: snapshot.steps,
        raw: snapshot.raw,
      },
    });
  }, [adapter, activeSource, state.kind, mode]);

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
    async (recipient, amount, sourceChain, token) => {
      setActiveSource(sourceChain);
      const adapterForSource = adapter;
      if (!adapterForSource) return;
      dispatch({ type: "QUOTE_START", recipient, amount });
      try {
        const result = await engine.quote({
          sourceChain,
          destinationChain: recipient.chain,
          recipient,
          amount,
          adapter: adapterForSource,
          token,
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
        const sourceChain =
          q.route.kind === "send" ? q.route.chain : q.route.sourceChain;
        clearInflight(
          mode,
          adapter.kind as WalletKind,
          adapter.address,
          sourceChain,
        );
        dispatch({
          type: "SEND_SUCCESS",
          finalTxHash: result.finalTxHash,
        });
      } else {
        const sourceChain =
          q.route.kind === "send" ? q.route.chain : q.route.sourceChain;
        const destinationChain =
          q.route.kind === "send" ? q.route.chain : q.route.destinationChain;
        const burned = result.steps.some(
          (s) => s.name === "burn" && s.state === "success",
        );
        const minted = result.steps.some(
          (s) => s.name === "mint" && s.state === "success",
        );
        if (burned && !minted && result.raw !== undefined) {
          saveInflight({
            mode,
            walletKind: adapter.kind as WalletKind,
            walletAddress: adapter.address,
            sourceChain,
            destinationChain,
            quote: q,
            steps: result.steps,
            error: serializeError(result.error),
            raw: result.raw,
          });
        }
        dispatch({
          type: "SEND_FAILURE",
          error: result.error,
          raw: result.raw,
        });
      }
    } catch (err) {
      dispatch({ type: "SEND_FAILURE", error: toWhiskError(err) });
    }
  }, [adapter, engine, state]);

  const retry = useCallback<WhiskActions["retry"]>(async () => {
    if (state.kind !== "failed") return;
    if (!adapter) return;
    if (!state.quote || !state.steps || state.raw === undefined) return;

    const failedSnapshot = {
      kind: "failure" as const,
      error: state.error,
      steps: state.steps,
      raw: state.raw,
    };
    dispatch({ type: "RETRY_START" });
    const onStep = (step: Step) => dispatch({ type: "STEP_UPDATE", step });
    try {
      const result = await engine.retry(
        { failed: failedSnapshot, adapter },
        { onStep },
      );
      const q = state.quote;
      const sourceChain =
        q && q.route.kind === "send"
          ? q.route.chain
          : q?.route.kind === "bridge"
            ? q.route.sourceChain
            : undefined;
      if (result.kind === "success") {
        if (sourceChain) {
          clearInflight(
            mode,
            adapter.kind as WalletKind,
            adapter.address,
            sourceChain,
          );
        }
        dispatch({ type: "SEND_SUCCESS", finalTxHash: result.finalTxHash });
      } else {
        const burned = result.steps.some(
          (s) => s.name === "burn" && s.state === "success",
        );
        const minted = result.steps.some(
          (s) => s.name === "mint" && s.state === "success",
        );
        if (burned && !minted && result.raw !== undefined && q && sourceChain) {
          const destinationChain =
            q.route.kind === "send" ? q.route.chain : q.route.destinationChain;
          saveInflight({
            mode,
            walletKind: adapter.kind as WalletKind,
            walletAddress: adapter.address,
            sourceChain,
            destinationChain,
            quote: q,
            steps: result.steps,
            error: serializeError(result.error),
            raw: result.raw,
          });
        }
        dispatch({
          type: "SEND_FAILURE",
          error: result.error,
          raw: result.raw,
        });
      }
    } catch (err) {
      dispatch({ type: "SEND_FAILURE", error: toWhiskError(err) });
    }
  }, [adapter, engine, state]);

  const reset = useCallback<WhiskActions["reset"]>(() => {
    // Clear persisted snapshot so a refresh doesn't resurrect a just-dismissed failure.
    if (adapter && activeSource) {
      clearInflight(
        mode,
        adapter.kind as WalletKind,
        adapter.address,
        activeSource,
      );
    }
    hydratedKeyRef.current = undefined;
    dispatch({ type: "RESET" });
  }, [adapter, activeSource, mode]);

  const actions: WhiskActions = { resolve, quote, back, send, retry, reset };

  return {
    state,
    actions,
    connected,
    address: account.primary?.address,
  };
}

export type { WhiskAction };
