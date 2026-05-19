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
  /**
   * USDC balance on the queried chain, when the registry has a verified
   * USDC address for it. Empty when the address isn't published yet
   * (e.g. Monad Testnet at v0.1).
   */
  usdc?: { value: bigint; formatted: string; decimals: number };
  /**
   * Balance for the user-selected token (USDC by default). When the
   * picker switches to EURC / USDT, this updates while `usdc` stays
   * pinned — the UI uses `selected` for the visible balance line and
   * `usdc` for the gas check on Arc chains.
   */
  selected?: {
    value: bigint;
    formatted: string;
    decimals: number;
    symbol: SupportedTokenAlias;
  };
  /** Native gas balance — used for the low-gas warning. */
  native?: { value: bigint; formatted: string; symbol: string };
  /**
   * Symbol of the token actually used for gas on this chain. For most
   * EVM chains this matches `native.symbol` (ETH, AVAX, MATIC, …). For
   * Arc chains, gas is paid in USDC, so this returns `"USDC"` and the
   * UI looks at the USDC balance for low-gas warnings.
   */
  gasSymbol?: string;
  /**
   * Heuristic: gas-token balance below the chain's safety threshold.
   * Not a precise gas estimate — just a "you'll probably fail to pay
   * gas" hint surfaced before the user clicks Send.
   */
  isLowGas: boolean;
  isLoading: boolean;
};

const LOW_GAS_THRESHOLD = 1n * 10n ** 14n; // ~1e-4 of native unit (EVM)
const SOL_LOW_GAS_LAMPORTS = 1_000_000n; // 0.001 SOL
// Arc charges gas in USDC. 0.05 USDC is a generous "you can probably
// land at least one tx" floor — actual cost depends on the operation.
const ARC_LOW_GAS_USDC = 50_000n; // 0.05 USDC (6 decimals)
const ARC_CHAINS = new Set<Chain>(["Arc_Testnet"]);

/**
 * Read USDC + native + selected-token balances for a wallet on a given
 * Whisk chain. Routes to wagmi for EVM and to `@solana/web3.js` for
 * Solana, returning the same normalised shape so consumers don't branch.
 *
 * `selectedToken` controls which token's balance lands in `result.selected`.
 * Defaults to `"USDC"`; pass `"EURC"` / `"USDT"` to track the active
 * token-picker selection. The `usdc` field stays pinned regardless —
 * Arc's low-gas check still needs it even when the user is sending EURC.
 */
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

  /* ── EVM via wagmi ──────────────────────────────────────────────── */
  const usdcQuery = useBalance({
    address: address as `0x${string}` | undefined,
    token: info?.usdcAddress as `0x${string}` | undefined,
    chainId: info?.evmChainId,
    query: {
      enabled: !!address && !!info?.usdcAddress && !!info?.evmChainId && isEvm,
    },
  });

  // Second token query — the user-selected token. When it matches USDC
  // (the default), we just reuse `usdcQuery` below to avoid a duplicate
  // round-trip; otherwise we fire a parallel `useBalance` against the
  // selected token's contract.
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

  /* ── Solana via @solana/web3.js ─────────────────────────────────── */
  const [solanaState, setSolanaState] = useState<{
    usdc?: { value: bigint; formatted: string; decimals: number };
    native?: { value: bigint; formatted: string; symbol: string };
    isLoading: boolean;
  }>({ isLoading: false });

  // Returns `undefined` when no `<ConnectionProvider>` is mounted (i.e.
  // EVM-only configs). Avoids the wallet-adapter sentinel-error noise.
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

        // Native SOL balance (lamports → SOL).
        const lamports = await connection.getBalance(owner);
        const native = {
          value: BigInt(lamports),
          formatted: (lamports / 1_000_000_000)
            .toFixed(9)
            .replace(/\.?0+$/, ""),
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
    // Solana only ships USDC for now in the registry; selected mirrors
    // usdc when the picker is on USDC, otherwise undefined.
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

  // Selected-token balance: reuses `usdc` when picker is on USDC, else
  // pulls from the parallel `selectedQuery`. Returns undefined when the
  // selected token isn't supported on this chain (no contract address
  // in the registry) so the UI can hide the balance line cleanly.
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

  // Arc chains pay gas in USDC, not in the native token. The low-gas
  // signal needs to look at the right balance and the UI label needs
  // to say "USDC" not "ARC".
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
