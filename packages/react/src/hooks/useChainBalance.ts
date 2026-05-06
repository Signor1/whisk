"use client";

import { useEffect, useState } from "react";
import { useBalance } from "wagmi";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { chainInfo, type Chain } from "@strimz/whisk-core";

export type ChainBalance = {
  /**
   * USDC balance on the queried chain, when the registry has a verified
   * USDC address for it. Empty when the address isn't published yet
   * (e.g. Monad Testnet at v0.1).
   */
  usdc?: { value: bigint; formatted: string; decimals: number };
  /** Native gas balance — used for the low-gas warning. */
  native?: { value: bigint; formatted: string; symbol: string };
  /**
   * Heuristic: native balance below ~1e-4 of the chain's native unit.
   * Not a precise gas estimate — just a "you'll probably fail to pay
   * gas" hint surfaced before the user clicks Send.
   */
  isLowGas: boolean;
  isLoading: boolean;
};

const LOW_GAS_THRESHOLD = 1n * 10n ** 14n; // ~1e-4 of native unit (EVM)
const SOL_LOW_GAS_LAMPORTS = 1_000_000n; // 0.001 SOL

/**
 * Read USDC + native balances for a wallet on a given Whisk chain.
 * Routes to wagmi for EVM chains and to `@solana/web3.js` for Solana,
 * returning the same normalised shape so consumers don't branch.
 */
export function useChainBalance(
  chain: Chain | undefined,
  address: string | undefined,
): ChainBalance {
  const info = chain ? chainInfo(chain) : undefined;
  const isEvm = info?.kind === "evm";
  const isSolana = info?.kind === "solana";

  /* ── EVM via wagmi ──────────────────────────────────────────────── */
  const usdcQuery = useBalance({
    address: address as `0x${string}` | undefined,
    token: info?.usdcAddress as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: {
      enabled: !!address && !!info?.usdcAddress && !!info?.evmChainId && isEvm,
    },
  });

  const nativeQuery = useBalance({
    address: address as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: { enabled: !!address && !!info?.evmChainId && isEvm },
  });

  /* ── Solana via @solana/web3.js ─────────────────────────────────── */
  const [solanaState, setSolanaState] = useState<{
    usdc?: { value: bigint; formatted: string; decimals: number };
    native?: { value: bigint; formatted: string; symbol: string };
    isLoading: boolean;
  }>({ isLoading: false });

  // useConnection is only available inside Solana's ConnectionProvider;
  // try/catch lets us call it unconditionally without crashing in
  // EVM-only setups.
  let connection: ReturnType<typeof useConnection>["connection"] | undefined;
  try {
    connection = useConnection().connection;
  } catch {
    connection = undefined;
  }

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

        // Native SOL balance (lamports → SOL).
        const lamports = await connection.getBalance(owner);
        const native = {
          value: BigInt(lamports),
          formatted: (lamports / 1_000_000_000).toFixed(9).replace(/\.?0+$/, ""),
          symbol: "SOL",
        };

        // USDC SPL balance — find the wallet's token account for the
        // mint and read its parsed amount. `getParsedTokenAccountsByOwner`
        // returns 0..n token accounts for any mint we filter on.
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
            // No token account = balance is zero.
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

  /* ── Merge into a single result ─────────────────────────────────── */
  if (isSolana) {
    const native = solanaState.native;
    const isLowGas =
      native !== undefined && native.value < SOL_LOW_GAS_LAMPORTS;
    return {
      usdc: solanaState.usdc,
      native,
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

  const isLowGas =
    native !== undefined && native.value < LOW_GAS_THRESHOLD;

  return {
    usdc,
    native,
    isLowGas,
    isLoading: usdcQuery.isLoading || nativeQuery.isLoading,
  };
}
