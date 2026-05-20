"use client";

import { useEffect, useState } from "react";
import { useBalance } from "wagmi";
import { PublicKey } from "@solana/web3.js";
import {
  chainInfo,
  tokenAddressFor,
  type Chain,
  type SupportedTokenAlias,
} from "@signordev/whisk-core";
import { safeUseConnection } from "./internal/safeSolana.js";

export type ChainBalance = {
  usdc?: { value: bigint; formatted: string; decimals: number };
  selected?: {
    value: bigint;
    formatted: string;
    decimals: number;
    symbol: SupportedTokenAlias;
  };
  native?: { value: bigint; formatted: string; symbol: string };
  /** "USDC" on Arc chains (gas-in-USDC); otherwise the native symbol. */
  gasSymbol?: string;
  isLowGas: boolean;
  isLoading: boolean;
};

const LOW_GAS_THRESHOLD = 1n * 10n ** 14n;
const SOL_LOW_GAS_LAMPORTS = 1_000_000n;
// Arc pays gas in USDC. 0.05 USDC is a generous floor.
const ARC_LOW_GAS_USDC = 50_000n;
const ARC_CHAINS = new Set<Chain>(["Arc_Testnet"]);

export function useChainBalance(
  chain: Chain | undefined,
  address: string | undefined,
  selectedToken: SupportedTokenAlias = "USDC",
): ChainBalance {
  const info = chain ? chainInfo(chain) : undefined;
  const isEvm = info?.kind === "evm";
  const isSolana = info?.kind === "solana";
  const selectedAddress =
    chain && info?.kind === "evm"
      ? tokenAddressFor(chain, selectedToken)
      : undefined;

  const usdcQuery = useBalance({
    address: address as `0x${string}` | undefined,
    token: info?.usdcAddress as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: {
      enabled: !!address && !!info?.usdcAddress && !!info?.evmChainId && isEvm,
    },
  });

  const isSelectedUsdc = selectedToken === "USDC";
  const selectedQuery = useBalance({
    address: address as `0x${string}` | undefined,
    token: selectedAddress as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: {
      enabled:
        !!address &&
        !!selectedAddress &&
        !!info?.evmChainId &&
        isEvm &&
        !isSelectedUsdc,
    },
  });

  const nativeQuery = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: { enabled: !!address && !!info?.evmChainId && isEvm },
  });

  const [solanaState, setSolanaState] = useState<{
    usdc?: { value: bigint; formatted: string; decimals: number };
    native?: { value: bigint; formatted: string; symbol: string };
    isLoading: boolean;
  }>({ isLoading: false });

  const connection = safeUseConnection();

  useEffect(() => {
    if (!isSolana || !address || !connection || !info) {
      setSolanaState({ isLoading: false });
      return;
    }
    let cancelled = false;
    setSolanaState((s) => ({ ...s, isLoading: true }));

    (async () => {
      try {
        const owner = new PublicKey(address);

        const lamports = await connection.getBalance(owner);
        const native = {
          value: BigInt(lamports),
          formatted: (lamports / 1_000_000_000)
            .toFixed(9)
            .replace(/\.?0+$/, ""),
          symbol: "SOL",
        };

        let usdc: ChainBalance["usdc"];
        if (info.usdcAddress) {
          const mint = new PublicKey(info.usdcAddress);
          const resp = await connection.getParsedTokenAccountsByOwner(owner, {
            mint,
          });
          const parsed = resp.value[0]?.account.data.parsed;
          const tokenAmt = parsed?.info?.tokenAmount as
            | { amount: string; decimals: number; uiAmountString: string }
            | undefined;
          if (tokenAmt) {
            usdc = {
              value: BigInt(tokenAmt.amount),
              formatted: tokenAmt.uiAmountString,
              decimals: tokenAmt.decimals,
            };
          } else {
            usdc = { value: 0n, formatted: "0", decimals: 6 };
          }
        }

        if (!cancelled) {
          setSolanaState({ usdc, native, isLoading: false });
        }
      } catch {
        if (!cancelled) setSolanaState({ isLoading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSolana, address, connection, info]);

  if (isSolana) {
    const native = solanaState.native;
    const isLowGas =
      native !== undefined && native.value < SOL_LOW_GAS_LAMPORTS;
    const selected =
      selectedToken === "USDC" && solanaState.usdc
        ? { ...solanaState.usdc, symbol: "USDC" as const }
        : undefined;
    return {
      usdc: solanaState.usdc,
      selected,
      native,
      gasSymbol: native?.symbol,
      isLowGas,
      isLoading: solanaState.isLoading,
    };
  }

  const usdc = usdcQuery.data
    ? {
        value: usdcQuery.data.value,
        formatted: usdcQuery.data.formatted,
        decimals: usdcQuery.data.decimals,
      }
    : undefined;

  const native = nativeQuery.data
    ? {
        value: nativeQuery.data.value,
        formatted: nativeQuery.data.formatted,
        symbol: nativeQuery.data.symbol,
      }
    : undefined;

  const selected: ChainBalance["selected"] = isSelectedUsdc
    ? usdc
      ? { ...usdc, symbol: "USDC" }
      : undefined
    : selectedQuery.data
      ? {
          value: selectedQuery.data.value,
          formatted: selectedQuery.data.formatted,
          decimals: selectedQuery.data.decimals,
          symbol: selectedToken,
        }
      : undefined;

  // Arc chains pay gas in USDC.
  const gasInUsdc = chain !== undefined && ARC_CHAINS.has(chain);
  const gasSymbol = gasInUsdc ? "USDC" : native?.symbol;
  const isLowGas = gasInUsdc
    ? usdc !== undefined && usdc.value < ARC_LOW_GAS_USDC
    : native !== undefined && native.value < LOW_GAS_THRESHOLD;

  return {
    usdc,
    selected,
    native,
    gasSymbol,
    isLowGas,
    isLoading:
      usdcQuery.isLoading ||
      nativeQuery.isLoading ||
      (!isSelectedUsdc && selectedQuery.isLoading),
  };
}
