"use client";

import { useCallback, useEffect, useState, type Dispatch } from "react";
import { WhiskSend, type SwapState, type WhiskState } from "@usewhisk/react";
import type { PlaygroundAction, PlaygroundConfig } from "./store";

/**
 * Fetches the Circle App Kit kit key from the playground's own
 * `/api/kit-key` route when Swap is enabled. The key never appears in
 * the static JS bundle — the server reads it from `CIRCLE_KIT_KEY`
 * and returns it only after the origin allow-list check passes.
 *
 * Returns `undefined` while the request is in flight or when Swap is
 * off, so `<WhiskSend>` falls back to transfer-only until the key
 * lands.
 */
function useSwapKitKey(enabled: boolean): string | undefined {
  const [kitKey, setKitKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setKitKey(undefined);
      return;
    }
    let cancelled = false;
    fetch("/api/kit-key", { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.kitKey) setKitKey(data.kitKey);
      })
      .catch(() => {
        /* Swap stays disabled. The widget renders transfer-only. */
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return kitKey;
}

/**
 * The actual `<WhiskSend>` driven by the current playground config.
 *
 * `lockX` toggles flip a value between the controlled prop (`amount`,
 * `recipient`, `sourceChain`, `destinationChain`) and the seeded
 * default (`defaultAmount`, `defaultRecipient`). When the lock is on,
 * the field is read-only in the widget; when off, the user can edit
 * it inside the widget itself.
 *
 * **Why `useCallback` on the lifecycle handlers.** `<WhiskSend>` puts
 * `onSuccess` / `onError` / `onStateChange` in a `useEffect`
 * dependency array internally. Inline arrow functions would get a
 * new identity every render, re-triggering the effect, which would
 * dispatch into our store, which would re-render `<Stage>`, which
 * would mint a new arrow, on and on. `useCallback` with `[dispatch]`
 * holds the identity stable (`dispatch` from `useReducer` is
 * guaranteed stable across renders).
 */
export function Stage({
  config,
  dispatch,
}: {
  config: PlaygroundConfig;
  dispatch: Dispatch<PlaygroundAction>;
}) {
  const kitKey = useSwapKitKey(config.swapEnabled);
  const swapAvailable = Boolean(kitKey) && config.swapEnabled;

  const handleSuccess = useCallback(
    (result: { finalTxHash?: string }) => {
      const tx = result.finalTxHash;
      dispatch({
        type: "LOG_EVENT",
        event: {
          kind: "success",
          label: "Transfer succeeded",
          detail: tx ? `${tx.slice(0, 10)}…${tx.slice(-6)}` : undefined,
        },
      });
    },
    [dispatch],
  );

  const handleError = useCallback(
    (error: Error) => {
      dispatch({
        type: "LOG_EVENT",
        event: {
          kind: "error",
          label: error.name ?? "Error",
          detail: error.message,
        },
      });
    },
    [dispatch],
  );

  const handleStateChange = useCallback(
    (state: WhiskState) => {
      // CCTP bridges land four sub-steps under `kind: "sending"`
      // (authorize → burn → wait → mint). Surface `currentStep` in the
      // log so a tester can tell them apart at a glance instead of
      // seeing four identical "state → sending" lines.
      const label =
        state.kind === "sending"
          ? `state → sending (${state.currentStep})`
          : `state → ${state.kind}`;
      dispatch({
        type: "LOG_EVENT",
        event: { kind: "state", label },
      });
    },
    [dispatch],
  );

  const handleSwapSuccess = useCallback(
    (result: { txHash?: string; amountOut?: string }) => {
      const tx = result.txHash;
      dispatch({
        type: "LOG_EVENT",
        event: {
          kind: "success",
          label: "Swap succeeded",
          detail: tx
            ? `${tx.slice(0, 10)}…${tx.slice(-6)}${result.amountOut ? ` · out ${result.amountOut}` : ""}`
            : result.amountOut
              ? `out ${result.amountOut}`
              : undefined,
        },
      });
    },
    [dispatch],
  );

  const handleSwapError = useCallback(
    (error: Error) => {
      dispatch({
        type: "LOG_EVENT",
        event: {
          kind: "error",
          label: `Swap: ${error.name ?? "Error"}`,
          detail: error.message,
        },
      });
    },
    [dispatch],
  );

  const handleSwapStateChange = useCallback(
    (state: SwapState) => {
      dispatch({
        type: "LOG_EVENT",
        event: {
          kind: "state",
          label: `swap state → ${state.kind}`,
        },
      });
    },
    [dispatch],
  );

  return (
    <WhiskSend
      showFooter={config.showFooter}
      kitKey={swapAvailable ? kitKey : undefined}
      tabs={swapAvailable ? ["transfer", "swap"] : ["transfer"]}
      amount={config.lockAmount ? config.amount : undefined}
      defaultAmount={config.lockAmount ? undefined : config.amount || undefined}
      recipient={
        config.lockRecipient ? config.recipient || undefined : undefined
      }
      defaultRecipient={
        config.lockRecipient ? undefined : config.recipient || undefined
      }
      sourceChain={config.lockSourceChain ? config.sourceChain : undefined}
      destinationChain={
        config.lockDestinationChain ? config.destinationChain : undefined
      }
      onSuccess={handleSuccess}
      onError={handleError}
      onStateChange={handleStateChange}
      onSwapSuccess={handleSwapSuccess}
      onSwapError={handleSwapError}
      onSwapStateChange={handleSwapStateChange}
    />
  );
}
