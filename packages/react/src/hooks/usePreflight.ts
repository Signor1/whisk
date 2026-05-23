"use client";

import { useMemo } from "react";
import { useChainId } from "wagmi";
import {
  chainInfo,
  type Chain,
  type Quote,
  type SupportedTokenAlias,
} from "@usewhisk/core";
import { useChainBalance } from "./useChainBalance.js";

export type PreflightCheckId = "balance" | "gas" | "chain";

export type PreflightStatus = "ok" | "warning" | "blocking";

export type PreflightCheck = {
  id: PreflightCheckId;
  status: PreflightStatus;
  message: string;
};

export type PreflightResult = {
  checks: PreflightCheck[];
  hasBlocking: boolean;
  isLoading: boolean;
};

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

  const tokenAlias =
    (quote?.token as SupportedTokenAlias | undefined) ?? "USDC";
  const balance = useChainBalance(sourceChain, walletAddress, tokenAlias);

  const walletChainId = useChainId();
  const sourceInfo = sourceChain ? chainInfo(sourceChain) : undefined;

  return useMemo<PreflightResult>(() => {
    if (!quote || !sourceChain) {
      return { checks: [], hasBlocking: false, isLoading: false };
    }

    const checks: PreflightCheck[] = [];

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

    if (balance.isLowGas) {
      const gasLabel = balance.gasSymbol ?? "gas";
      checks.push({
        id: "gas",
        status: "warning",
        message: `Low ${gasLabel} balance — the source-chain tx may fail to pay gas.`,
      });
    }

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
