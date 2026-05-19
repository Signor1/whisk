"use client";

import { useMemo } from "react";
import { useChainId } from "wagmi";
import {
  chainInfo,
  type Chain,
  type Quote,
  type SupportedTokenAlias,
} from "@signordev/whisk-core";
import { useChainBalance } from "./useChainBalance.js";

/**
 * Pre-flight check identifier. Stable IDs so consumers can filter /
 * style them deterministically (e.g. show the balance check banner in
 * red, the gas check in amber).
 */
export type PreflightCheckId = "balance" | "gas" | "chain";

/**
 * Result of one pre-flight check.
 *
 * - `ok` — green. No action needed.
 * - `warning` — yellow. Send still proceeds, but the user should be aware
 *   (e.g. low gas balance — usually fine but might fail under heavy load).
 * - `blocking` — red. Send button is gated until the user resolves it.
 */
export type PreflightStatus = "ok" | "warning" | "blocking";

export type PreflightCheck = {
  id: PreflightCheckId;
  status: PreflightStatus;
  /** Short human-readable summary, suitable for an inline banner. */
  message: string;
};

export type PreflightResult = {
  checks: PreflightCheck[];
  /** True when at least one check is `blocking`. UI gates Send on this. */
  hasBlocking: boolean;
  /** True while balances are still being fetched. */
  isLoading: boolean;
};

/**
 * Pre-flight checks run before the user signs anything.
 *
 * Every check is **read-only** — balance reads via wagmi/RPC, chain-id
 * inspection via the wallet's current state. Zero transactions, zero
 * gas. The hook never costs the user money to run.
 *
 * What we catch:
 *
 * 1. **Insufficient token balance.** Compares `quote.amountIn` against
 *    the wallet's USDC/EURC/USDT balance on the source chain. Blocking
 *    when short — there's no point letting the user sign a doomed tx.
 * 2. **Low native-gas balance.** Heuristic from `useChainBalance`'s
 *    `isLowGas`. Warning, not blocking — wallets sometimes auto-fund
 *    via faucets / sponsorship and the heuristic doesn't see it.
 * 3. **Wrong chain selected in wallet.** Compares wagmi's `useChainId`
 *    (the chain the connected wallet is currently on) against the
 *    source chain Whisk wants to send from. Blocking — signing on the
 *    wrong chain produces a confusing "user rejected" or fails outright.
 *    Solana isn't checked here (no equivalent of wagmi `useChainId`);
 *    that path falls through as `ok`.
 *
 * The Review step renders the `checks` inline as a notice list and
 * gates the Send button on `hasBlocking`.
 */
export function usePreflight(
  quote: Quote | undefined,
  walletAddress: string | undefined,
): PreflightResult {
  const route = quote?.route;
  const sourceChain: Chain | undefined =
    route?.kind === "send"
      ? route.chain
      : route?.kind === "bridge"
        ? route.sourceChain
        : undefined;

  // Source-chain balance (USDC + native gas + the user-selected token).
  // Defaults to USDC since that's the only token CCTP bridges support;
  // same-chain sends could in theory use other tokens but the engine
  // already coerces non-USDC bridges to USDC in `quote()`.
  const tokenAlias =
    (quote?.token as SupportedTokenAlias | undefined) ?? "USDC";
  const balance = useChainBalance(sourceChain, walletAddress, tokenAlias);

  // wagmi's `useChainId` returns the wallet's current EVM chain, or 0
  // when no wallet is connected. We compare against the source chain's
  // expected `evmChainId` from our registry.
  const walletChainId = useChainId();
  const sourceInfo = sourceChain ? chainInfo(sourceChain) : undefined;

  return useMemo<PreflightResult>(() => {
    if (!quote || !sourceChain) {
      return { checks: [], hasBlocking: false, isLoading: false };
    }

    const checks: PreflightCheck[] = [];

    /* ─── Balance check ────────────────────────────────────────────── */
    // Parse `quote.amountIn` (decimal string) against the balance's
    // base-unit `value` (bigint). We use the selected token's decimals
    // to compare like-with-like.
    const selected = balance.selected;
    if (selected) {
      const required = parseAmount(quote.amountIn, selected.decimals);
      if (required !== null && selected.value < required) {
        checks.push({
          id: "balance",
          status: "blocking",
          message: `Insufficient ${selected.symbol} — need ${quote.amountIn}, have ${selected.formatted}.`,
        });
      }
    }

    /* ─── Gas check ────────────────────────────────────────────────── */
    if (balance.isLowGas) {
      const gasLabel = balance.gasSymbol ?? "gas";
      checks.push({
        id: "gas",
        status: "warning",
        message: `Low ${gasLabel} balance — the source-chain tx may fail to pay gas.`,
      });
    }

    /* ─── Chain alignment check (EVM only) ─────────────────────────── */
    if (
      sourceInfo?.kind === "evm" &&
      sourceInfo.evmChainId !== undefined &&
      walletChainId !== 0 &&
      walletChainId !== sourceInfo.evmChainId
    ) {
      checks.push({
        id: "chain",
        status: "blocking",
        message: `Wallet is on chain ${walletChainId}, but sending from ${sourceInfo.label} (${sourceInfo.evmChainId}). Switch networks in your wallet.`,
      });
    }

    return {
      checks,
      hasBlocking: checks.some((c) => c.status === "blocking"),
      isLoading: balance.isLoading,
    };
  }, [quote, sourceChain, balance, walletChainId, sourceInfo]);
}

/**
 * Parse a decimal amount string into the corresponding base-unit
 * bigint, given the token's decimal count. Returns `null` on
 * unparseable input — the caller treats that as "skip the check"
 * rather than blocking the user with a confusing error.
 *
 * Avoids floating-point imprecision: parses the integer and fractional
 * parts separately so values like `"0.000001"` survive.
 */
function parseAmount(amount: string, decimals: number): bigint | null {
  const trimmed = amount.trim();
  if (!trimmed) return null;
  const [intPart, fracPart = ""] = trimmed.split(".");
  if (!/^\d+$/.test(intPart ?? "") || !/^\d*$/.test(fracPart)) return null;
  const paddedFrac = (fracPart + "0".repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(intPart + paddedFrac);
  } catch {
    return null;
  }
}
