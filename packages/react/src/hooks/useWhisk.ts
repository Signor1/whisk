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
} from "@signordev/whisk-core";
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
    /** Token alias to send. Optional — defaults to engine config / USDC. */
    token?: Token,
  ) => Promise<void>;
  /** Go back to the input step from review. */
  back: () => void;
  /** Execute the send/bridge currently in `review` state. */
  send: () => Promise<void>;
  /**
   * Resume a mid-flight bridge failure. Only valid when state is
   * `failed` with `raw` preserved (i.e. the burn succeeded but the
   * destination mint failed — most commonly a Circle Iris forwarder
   * timeout). For pre-burn failures, call `reset()` instead.
   */
  retry: () => Promise<void>;
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
  // Mode is resolved inside `createWhisk` and baked into the
  // engine's exposed config. Used for persistence-key namespacing —
  // testnet snapshots can't surface in a mainnet config and vice
  // versa. Defaults to "testnet" defensively if somehow undefined,
  // matching `createWhisk`'s inference fallback.
  const mode = engine.config.mode ?? "testnet";
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

  /* -------------------------------------------------------------------- *
   * In-flight failure recovery (P1)                                       *
   *                                                                       *
   * When a bridge failed mid-flight (USDC burned, mint not yet landed)    *
   * we persist a snapshot to localStorage. On a fresh mount — same        *
   * wallet, same source chain — we restore the failed state so the        *
   * "Complete the mint" CTA lights up automatically. Avoids stranding     *
   * users who refresh or close the tab between the burn and the mint.    *
   *                                                                       *
   * Dedupe via `hydratedKeyRef` so the effect doesn't re-dispatch on       *
   * every re-render. Hydration only fires from the `idle` state — never  *
   * overwriting an active flow.                                          *
   * -------------------------------------------------------------------- */
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
        // Success — clear any persisted mid-flight snapshot for this
        // (wallet, source). Belt and braces: the snapshot would also
        // be evicted by `loadInflight`'s expiry check, but clearing
        // now keeps storage tidy.
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
        // Mid-flight detection: bridge burn succeeded but mint hasn't
        // landed. Persist the snapshot so a refresh / tab close
        // doesn't strand the funds.
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
        // Preserve `raw` so `retry` can resume via kit.retryBridge.
        // Only the bridge path populates it — same-chain sends leave
        // it `undefined`, which makes `retry` a no-op for sends. That's
        // correct: a same-chain send has nothing mid-flight to resume.
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

    // Take the current failed snapshot and dispatch RETRY_START — the
    // reducer pivots us back into `sending` while keeping the existing
    // step list. From there the listener feeds incremental updates the
    // same way `send` does.
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
      // Same snapshot bookkeeping as `send`: clear on success, re-save
      // if we're still mid-flight after retry, otherwise leave alone.
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
    // An explicit reset means the user has abandoned the in-flight
    // recovery path. Clear persisted snapshot so a refresh doesn't
    // immediately resurrect the same failure they just dismissed.
    if (adapter && activeSource) {
      clearInflight(
        mode,
        adapter.kind as WalletKind,
        adapter.address,
        activeSource,
      );
    }
    // Allow the next mount to hydrate again if a new mid-flight
    // failure happens later — reset the dedupe ref.
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
