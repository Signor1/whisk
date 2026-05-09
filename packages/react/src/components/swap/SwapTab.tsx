"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ChevronLeft, ExternalLink, RefreshCw } from "lucide-react";
import {
  chainInfo,
  chainsByNetwork,
  type Chain,
  type Token,
} from "@strimz/whisk-core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
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
};

const SWAP_TOKENS: Token[] = [
  "USDC",
  "EURC",
  "USDT",
  "USDe",
  "DAI",
  "PYUSD",
  "cirBTC",
  "NATIVE",
];

export function SwapTab({
  kitKey,
  defaultChain,
  defaultTokenIn = "USDC",
  defaultTokenOut = "EURC",
}: SwapTabProps) {
  const { config } = useWhiskContext();
  const account = useWhiskAccount();
  const swap = useWhiskSwap();

  // Only EVM chains the dev configured. Solana swap is supported by App
  // Kit but we defer it with the rest of Solana to v0.2.
  const chainOptions = useMemo<Chain[]>(() => {
    const evm = (config.chains ?? []).filter(
      (c) => chainInfo(c).kind === "evm",
    );
    return evm.length > 0 ? evm : chainsByNetwork("testnet").map((c) => c.chain);
  }, [config.chains]);

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
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <header>
          <button
            type="button"
            className="whisk-link"
            onClick={swap.back}
            disabled={busy}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              fontSize: "0.8125rem",
              marginBottom: "0.375rem",
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} /> Back
          </button>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
            Review swap
          </h2>
        </header>

        <div className="whisk-summary">
          <Row label="You pay" value={`${e.amountIn} ${e.tokenIn}`} />
          <Row
            label="You receive (estimated)"
            value={`${e.amountOut} ${e.tokenOut}`}
          />
          {parseFloat(e.minOutput) < parseFloat(e.amountOut) ? (
            <Row label="Minimum received" value={`${e.minOutput} ${e.tokenOut}`} />
          ) : null}
          <Row label="Fees" value={`${e.fees.total} ${e.tokenIn}`} />
          <Row label="Network" value={chainInfo(chain).label} />
        </div>

        <Button onClick={() => void swap.swap()} disabled={busy} variant="primary">
          {busy ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="whisk-spinner" /> Swapping…
            </span>
          ) : (
            `Swap ${e.amountIn} ${e.tokenIn} for ${e.tokenOut}`
          )}
        </Button>
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
          Trade between stablecoins on the same chain. Powered by App Kit.
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
          value=""
          readOnly
          placeholder="—"
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
            {account.evm.chainName ?? `chain ${account.evm.chainId}`}. Switch
            to {chainInfo(chain).label} to swap.
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
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
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
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
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
        <p className="whisk-help whisk-help--error" style={{ marginTop: "0.25rem" }}>
          {message}
        </p>
      </header>
      <Button variant="outline" onClick={onReset}>
        Try again
      </Button>
    </div>
  );
}
