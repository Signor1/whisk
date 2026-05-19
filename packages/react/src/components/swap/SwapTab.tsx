"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeftRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { chainInfo, type Chain, type Token } from "@signordev/whisk-core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
import { useWhiskAdapter } from "../../hooks/useWhiskAdapter.js";
import { useWhiskSwap } from "../../hooks/useWhiskSwap.js";
import { Button } from "../ui/Button.js";
import { ChainPicker } from "../ui/ChainPicker.js";
import { FieldBox } from "../ui/FieldBox.js";
import { TokenPicker } from "../ui/TokenPicker.js";

/**
 * Swap tab — same-chain token swap powered by App Kit's Swap kit.
 *
 * `kitKey` is required (Circle Console issues it free). Without it, the
 * swap provider rejects every request.
 *
 * Token list is App Kit's recognised aliases — for custom contract
 * addresses, the host can pass `tokenInAddress` / `tokenOutAddress` props
 * (deferred to a follow-up; v0.1 ships with the alias set).
 */
export type SwapTabProps = {
  /** Required Circle Console kit key for the swap provider. */
  kitKey?: string;
  /** Pre-fill the source chain. */
  defaultChain?: Chain;
  /** Pre-fill tokenIn. */
  defaultTokenIn?: Token;
  /** Pre-fill tokenOut. */
  defaultTokenOut?: Token;
  /** Fires for every swap state transition (idle → estimating → review → swapping → succeeded/failed). */
  onStateChange?: (
    state: import("../../hooks/useWhiskSwap.js").SwapState,
  ) => void;
  /** Fires once when a swap completes successfully. */
  onSuccess?: (result: {
    txHash?: string;
    explorerUrl?: string;
    amountOut?: string;
  }) => void;
  /** Fires once when a swap fails terminally. */
  onError?: (error: Error) => void;
};

/**
 * Tokens available in the swap picker.
 *
 * Whisk is testnet-only at the moment, and App Kit's swap on testnet
 * runs exclusively on Arc Testnet. The docs list `cirBTC` alongside
 * USDC/EURC, but Circle's own product page (circle.com/cirbtc) marks
 * cirBTC as "coming soon, subject to applicable regulatory approvals"
 * — estimates and swaps both fail in practice. Dropped from the
 * picker until it lands.
 *
 * When mainnet support flips on, swap this constant for a per-chain
 * map (e.g. Arc Testnet → testnet pair, mainnet chains → full
 * stablecoin set + wrapped tokens + NATIVE).
 */
const SWAP_TOKENS: Token[] = ["USDC", "EURC"];

/**
 * Chains available in the swap picker.
 *
 * Same reasoning as `SWAP_TOKENS` — Arc Testnet is the only testnet
 * App Kit supports swap on. Listed as a single-entry array so the
 * picker structure is in place for the day mainnet support flips on.
 */
const SWAP_CHAINS: Chain[] = ["Arc_Testnet"];

export function SwapTab({
  kitKey,
  defaultChain,
  defaultTokenIn = "USDC",
  defaultTokenOut = "EURC",
  onStateChange,
  onSuccess,
  onError,
}: SwapTabProps) {
  const { config, engine } = useWhiskContext();
  const account = useWhiskAccount();
  const swap = useWhiskSwap();

  // Lifecycle bridge — mirrors the transfer side in WhiskSend. Consumers
  // pass useCallback-stabilised handlers; the effect re-fires on every
  // state transition without identity churn.
  useEffect(() => {
    onStateChange?.(swap.state);
  }, [swap.state, onStateChange]);

  useEffect(() => {
    if (swap.state.kind === "succeeded") {
      onSuccess?.({
        txHash: swap.state.txHash,
        explorerUrl: swap.state.explorerUrl,
        amountOut: swap.state.amountOut,
      });
    } else if (swap.state.kind === "failed") {
      onError?.(swap.state.error);
    }
  }, [swap.state, onSuccess, onError]);

  // Swap is currently testnet-only via Arc Testnet. The dev's
  // `config.chains` array drives every other surface (transfer,
  // bridge); the swap picker stays anchored to `SWAP_CHAINS` until
  // mainnet support flips on. If the host hasn't registered Arc
  // Testnet at all, we still surface it here — the engine will fail
  // loudly if the adapter isn't wired, which is the correct error.
  const chainOptions = SWAP_CHAINS;

  const [chain, setChain] = useState<Chain>(
    () => defaultChain ?? chainOptions[0] ?? "Arc_Testnet",
  );
  const [tokenIn, setTokenIn] = useState<Token>(defaultTokenIn);
  const [tokenOut, setTokenOut] = useState<Token>(defaultTokenOut);
  const [amount, setAmount] = useState("");
  const [keyInput, setKeyInput] = useState("");

  const effectiveKey = kitKey ?? keyInput;
  const isConnected = account.evm.isConnected;
  const wrongChain = isConnected && account.isWrongChain(chain);

  const canEstimate =
    isConnected &&
    !wrongChain &&
    !!effectiveKey &&
    parseFloat(amount || "0") > 0 &&
    tokenIn !== tokenOut;

  /* ─── Live "You receive" preview ──────────────────────────────────── *
   * Calls `engine.estimateSwap` from a debounced effect so the
   * destination amount fills in as the user types — same UX as Uniswap
   * / 1inch. Doesn't touch the swap state machine; the real
   * estimate-and-commit flow still runs when the user clicks "Get quote".
   */
  const previewAdapter = useWhiskAdapter(chain);
  const [previewOut, setPreviewOut] = useState<string>("");
  const [previewBusy, setPreviewBusy] = useState(false);

  useEffect(() => {
    if (!canEstimate || !previewAdapter) {
      setPreviewOut("");
      setPreviewBusy(false);
      return;
    }

    let cancelled = false;
    setPreviewBusy(true);

    const handle = setTimeout(async () => {
      try {
        const estimate = await engine.estimateSwap({
          chain,
          tokenIn,
          tokenOut,
          amountIn: amount,
          kitKey: effectiveKey,
          adapter: previewAdapter,
        });
        if (!cancelled) {
          setPreviewOut(estimate.amountOut);
          setPreviewBusy(false);
        }
      } catch {
        // Quiet on preview errors — the real "Get quote" path surfaces
        // them. Clear the value so the user isn't left with stale data.
        if (!cancelled) {
          setPreviewOut("");
          setPreviewBusy(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [
    engine,
    previewAdapter,
    chain,
    tokenIn,
    tokenOut,
    amount,
    effectiveKey,
    canEstimate,
  ]);

  /* ─── Result / failed ─────────────────────────────────────────────── */

  if (swap.state.kind === "succeeded") {
    return (
      <SuccessView
        amountIn={swap.state.estimate.amountIn}
        amountOut={swap.state.amountOut ?? swap.state.estimate.amountOut}
        tokenIn={swap.state.estimate.tokenIn}
        tokenOut={swap.state.estimate.tokenOut}
        explorerUrl={swap.state.explorerUrl}
        onReset={swap.reset}
      />
    );
  }

  if (swap.state.kind === "failed") {
    return (
      <FailureView message={swap.state.error.message} onReset={swap.reset} />
    );
  }

  /* ─── Review (estimate ready) ─────────────────────────────────────── */

  if (swap.state.kind === "review" || swap.state.kind === "swapping") {
    const e = swap.state.estimate;
    const busy = swap.state.kind === "swapping";
    return (
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
      >
        <header>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.25rem",
            }}
          >
            <ArrowLeftRight size={18} strokeWidth={2} />
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
              Review swap
            </h2>
          </div>
          <p
            className="whisk-help"
            style={{ marginTop: "0.125rem", marginBottom: 0 }}
          >
            Same-chain {e.tokenIn} → {e.tokenOut} on {chainInfo(chain).label}.
          </p>
        </header>

        <div className="whisk-summary">
          <Row label="You pay" value={`${e.amountIn} ${e.tokenIn}`} />
          <Row
            label="You receive (estimated)"
            value={`${e.amountOut} ${e.tokenOut}`}
          />
          {parseFloat(e.minOutput) < parseFloat(e.amountOut) ? (
            <Row
              label="Minimum received"
              value={`${e.minOutput} ${e.tokenOut}`}
            />
          ) : null}
          <Row label="Fees" value={`${e.fees.total} ${e.tokenIn}`} />
          <Row label="Network" value={chainInfo(chain).label} />
        </div>

        {/* Re-check wrong-chain at submission time. App Kit's permit
         *  flow requires the wallet to be ACTIVE on the swap chain;
         *  if the user switched networks between getting a quote and
         *  clicking swap, the signature would otherwise blow up with
         *  a viem "Provided chainId X must match the active chainId Y"
         *  error. Surfacing the switch CTA here recovers cleanly. */}
        {wrongChain ? (
          <Button
            variant="primary"
            onClick={() => void account.switchChain(chain)}
            disabled={busy}
          >
            Switch to {chainInfo(chain).label}
          </Button>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="ghost" onClick={swap.back} disabled={busy}>
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => void swap.swap()}
              disabled={busy}
              style={{ flex: 1 }}
            >
              {busy ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="whisk-spinner" /> Swapping…
                </span>
              ) : (
                `Swap ${e.amountIn} ${e.tokenIn} for ${e.tokenOut}`
              )}
            </Button>
          </div>
        )}
      </div>
    );
  }

  /* ─── Idle / estimating ───────────────────────────────────────────── */

  const busy = swap.state.kind === "estimating";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
          Swap
        </h2>
        <p
          className="whisk-help"
          style={{ marginTop: "0.125rem", marginBottom: 0 }}
        >
          Trade between stablecoins on the same chain.
        </p>
      </header>

      {!kitKey ? (
        <FieldBox
          label="Kit key"
          type="text"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="KIT_KEY:..."
          spellCheck={false}
          autoComplete="off"
          mono
        />
      ) : null}

      <ChainPicker
        label="Network"
        value={chain}
        options={chainOptions}
        onChange={setChain}
      />

      <div className="whisk-amount-row">
        <FieldBox
          label="You pay"
          className="whisk-amount-row__input"
          type="text"
          value={amount}
          onChange={(e) => setAmount(sanitiseAmount(e.target.value))}
          inputMode="decimal"
          placeholder="0.0"
          autoComplete="off"
          amount
        />
        <TokenPicker
          value={tokenIn}
          options={SWAP_TOKENS}
          onChange={setTokenIn}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          className="whisk-swap-flip"
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
          }}
          aria-label="Swap directions"
        >
          <ArrowDown size={14} strokeWidth={2.5} />
        </button>
      </div>

      <div className="whisk-amount-row">
        <FieldBox
          label="You receive (estimated)"
          className="whisk-amount-row__input"
          type="text"
          value={previewOut}
          readOnly
          placeholder={previewBusy ? "Calculating…" : "—"}
          tabIndex={-1}
          amount
        />
        <TokenPicker
          value={tokenOut}
          options={SWAP_TOKENS}
          onChange={setTokenOut}
        />
      </div>

      {wrongChain ? (
        <div className="whisk-banner" role="status">
          <span>
            Wallet is on{" "}
            {account.evm.chainName ?? `chain ${account.evm.chainId}`}. Switch to{" "}
            {chainInfo(chain).label} to swap.
          </span>
          <button
            type="button"
            className="whisk-link"
            onClick={() => void account.switchChain(chain)}
          >
            Switch network
          </button>
        </div>
      ) : null}

      <Button
        variant="primary"
        disabled={!canEstimate || busy}
        onClick={() =>
          void swap.estimate({
            chain,
            tokenIn,
            tokenOut,
            amountIn: amount,
            kitKey: effectiveKey,
          })
        }
      >
        {busy ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span className="whisk-spinner" /> Quoting…
          </span>
        ) : (
          "Get quote"
        )}
      </Button>
    </div>
  );
}

function sanitiseAmount(input: string): string {
  // Allow only digits + a single dot. Strip leading zeros but preserve "0."
  const cleaned = input.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="whisk-summary__row">
      <span className="whisk-summary__label">{label}</span>
      <span className="whisk-summary__value">{value}</span>
    </div>
  );
}

function SuccessView({
  amountIn,
  amountOut,
  tokenIn,
  tokenOut,
  explorerUrl,
  onReset,
}: {
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  explorerUrl?: string;
  onReset: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
          Swap complete
        </h2>
      </header>
      <div className="whisk-summary">
        <Row label="Swapped" value={`${amountIn} ${tokenIn}`} />
        <Row label="Received" value={`${amountOut} ${tokenOut}`} />
      </div>
      {explorerUrl ? (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="whisk-link"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            fontSize: "0.8125rem",
          }}
        >
          <ExternalLink size={14} strokeWidth={2.5} /> View on explorer
        </a>
      ) : null}
      <Button variant="outline" onClick={onReset}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <RefreshCw size={14} strokeWidth={2.5} /> Swap again
        </span>
      </Button>
    </div>
  );
}

function FailureView({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <header>
        <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
          Swap failed
        </h2>
        <p
          className="whisk-help whisk-help--error"
          style={{ marginTop: "0.25rem" }}
        >
          {message}
        </p>
      </header>
      <Button variant="outline" onClick={onReset}>
        Try again
      </Button>
    </div>
  );
}
