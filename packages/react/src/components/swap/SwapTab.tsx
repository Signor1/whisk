"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeftRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  chainInfo,
  type Chain,
  type SupportedTokenAlias,
  type Token,
} from "@usewhisk/core";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";
import { useWhiskAccount } from "../../hooks/useWhiskAccount.js";
import { useWhiskAdapter } from "../../hooks/useWhiskAdapter.js";
import { useWhiskSwap } from "../../hooks/useWhiskSwap.js";
import { useChainBalance } from "../../hooks/useChainBalance.js";
import { BalanceLine } from "../ui/BalanceLine.js";
import { Button } from "../ui/Button.js";
import { ChainPicker } from "../ui/ChainPicker.js";
import { FieldBox } from "../ui/FieldBox.js";
import { TokenPicker } from "../ui/TokenPicker.js";

export type SwapTabProps = {
  kitKey?: string;
  defaultChain?: Chain;
  defaultTokenIn?: Token;
  defaultTokenOut?: Token;
  onStateChange?: (
    state: import("../../hooks/useWhiskSwap.js").SwapState,
  ) => void;
  onSuccess?: (result: {
    txHash?: string;
    explorerUrl?: string;
    amountOut?: string;
  }) => void;
  onError?: (error: Error) => void;
};

// Swap-capable chains and their token lists, per Arc App Kit docs.
// Mainnet chains share the broad stablecoin set + NATIVE. Arc Testnet is the
// only testnet that supports Swap and is limited to USDC / EURC / cirBTC.
const MAINNET_SWAP_TOKENS: Token[] = [
  "USDC",
  "EURC",
  "USDT",
  "USDe",
  "DAI",
  "PYUSD",
  "NATIVE",
];

const SWAP_TOKENS_BY_CHAIN: Partial<Record<Chain, Token[]>> = {
  // Arc App Kit docs list cirBTC as supported on Arc Testnet, but Circle
  // hasn't published a faucet or contract address for it — quote attempts
  // 404. Re-add once Circle ships testnet infrastructure for cirBTC.
  Arc_Testnet: ["USDC", "EURC"],
  Arbitrum: MAINNET_SWAP_TOKENS,
  Avalanche: MAINNET_SWAP_TOKENS,
  Base: MAINNET_SWAP_TOKENS,
  Ethereum: MAINNET_SWAP_TOKENS,
  HyperEVM: MAINNET_SWAP_TOKENS,
  Ink: MAINNET_SWAP_TOKENS,
  Linea: MAINNET_SWAP_TOKENS,
  Monad: MAINNET_SWAP_TOKENS,
  Optimism: MAINNET_SWAP_TOKENS,
  Plume: MAINNET_SWAP_TOKENS,
  Polygon: MAINNET_SWAP_TOKENS,
  Sei: MAINNET_SWAP_TOKENS,
  Solana: MAINNET_SWAP_TOKENS,
  Sonic: MAINNET_SWAP_TOKENS,
  Unichain: MAINNET_SWAP_TOKENS,
  World_Chain: MAINNET_SWAP_TOKENS,
  XDC: MAINNET_SWAP_TOKENS,
};

export function SwapTab({
  kitKey,
  defaultChain,
  defaultTokenIn = "USDC",
  defaultTokenOut = "EURC",
  onStateChange,
  onSuccess,
  onError,
}: SwapTabProps) {
  const { engine, config } = useWhiskContext();
  const account = useWhiskAccount();
  const swap = useWhiskSwap();

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

  // Chains the dev configured ∩ App Kit's swap-capable set ∩ the active mode.
  // The mode filter is a defensive belt — if the dev mis-scoped `chains` for
  // their mode (e.g. mainnet mode with Arc_Testnet listed), the swap UI still
  // won't surface the off-mode chain.
  const mode = engine.config.mode;
  const chainOptions = useMemo<Chain[]>(
    () =>
      config.chains.filter((c) => {
        if (!SWAP_TOKENS_BY_CHAIN[c]) return false;
        if (mode && chainInfo(c).network !== mode) return false;
        return true;
      }),
    [config.chains, mode],
  );

  const [chain, setChain] = useState<Chain>(
    () =>
      (defaultChain && SWAP_TOKENS_BY_CHAIN[defaultChain]
        ? defaultChain
        : chainOptions[0]) ?? "Arc_Testnet",
  );

  // Tokens supported by the active chain. Falls back to Arc Testnet's set if
  // the chain isn't in the map (shouldn't happen with chainOptions gating).
  const tokenOptions = useMemo<Token[]>(
    () => SWAP_TOKENS_BY_CHAIN[chain] ?? ["USDC", "EURC"],
    [chain],
  );

  const [tokenIn, setTokenIn] = useState<Token>(defaultTokenIn);
  const [tokenOut, setTokenOut] = useState<Token>(defaultTokenOut);
  const [amount, setAmount] = useState("");
  const [keyInput, setKeyInput] = useState("");

  // Snap tokens back to a valid pair when the chain changes and the previous
  // selection isn't available on the new chain.
  useEffect(() => {
    if (!tokenOptions.includes(tokenIn)) {
      setTokenIn(tokenOptions[0] ?? "USDC");
    }
    if (!tokenOptions.includes(tokenOut)) {
      const fallback = tokenOptions.find((t) => t !== (tokenIn as Token));
      setTokenOut(fallback ?? tokenOptions[0] ?? "EURC");
    }
  }, [tokenOptions, tokenIn, tokenOut]);

  const effectiveKey = kitKey ?? keyInput;
  // Swap is per-chain — use the wallet matching the active chain's ecosystem
  // (Solana mainnet swap needs a Solana wallet; everything else needs EVM).
  const swapAccount = account.accountFor(chain);
  const isConnected = swapAccount.isConnected;
  const wrongChain = isConnected && account.isWrongChain(chain);

  // Balance lookup for the You-pay token. Only meaningful when `tokenIn` is a
  // recognized alias (USDC / EURC / USDT); contract-address inputs skip the
  // line since useChainBalance can't price arbitrary tokens.
  const tokenInAlias: SupportedTokenAlias | undefined =
    tokenIn === "USDC" || tokenIn === "EURC" || tokenIn === "USDT"
      ? tokenIn
      : undefined;
  const balance = useChainBalance(
    chain,
    swapAccount.address,
    tokenInAlias ?? "USDC",
  );
  const onMax = () => {
    const max = balance.selected?.formatted;
    if (max) setAmount(sanitiseAmount(max));
  };

  const canEstimate =
    isConnected &&
    !wrongChain &&
    !!effectiveKey &&
    parseFloat(amount || "0") > 0 &&
    tokenIn !== tokenOut;

  // Debounced preview — fills "You receive" as the user types without touching the swap machine.
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
        // Preview errors are silent — the real "Get quote" path surfaces them.
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

  if (chainOptions.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <header>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>
            Swap
          </h2>
        </header>
        <p className="whisk-help" style={{ margin: 0 }}>
          None of the chains in your config support Swap. Add a swap-capable
          chain (Arc Testnet, or any supported mainnet) to enable this tab.
        </p>
      </div>
    );
  }

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

        {/* App Kit's permit flow requires the wallet to be active on the swap chain. */}
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

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <FieldBox
          label="You pay"
          type="text"
          value={amount}
          onChange={(e) => setAmount(sanitiseAmount(e.target.value))}
          inputMode="decimal"
          placeholder="0.0"
          autoComplete="off"
          amount
          suffix={
            <TokenPicker
              value={tokenIn}
              options={tokenOptions}
              onChange={setTokenIn}
            />
          }
        />
        {tokenInAlias && balance.selected ? (
          <BalanceLine
            balance={balance.selected.formatted}
            symbol={balance.selected.symbol}
            onMax={onMax}
          />
        ) : null}
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

      <FieldBox
        label="You receive (estimated)"
        type="text"
        value={previewOut}
        readOnly
        placeholder={previewBusy ? "Calculating…" : "—"}
        tabIndex={-1}
        amount
        suffix={
          <TokenPicker
            value={tokenOut}
            options={tokenOptions}
            onChange={setTokenOut}
          />
        }
      />

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
