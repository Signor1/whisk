"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { chainByEvmId, chainInfo, type Chain } from "@signordev/whisk-core";
import { viemChainForWhisk } from "../config/adapters/evm.js";
import { useSolanaAccount } from "./useSolanaAccount.js";

export type WhiskAccountInfo = {
  /** Whether this ecosystem has a connected wallet right now. */
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  kind: "evm" | "solana";
  connectorName?: string;
  /** EVM only — undefined for Solana. */
  chainId?: number;
  /** The Whisk Chain literal corresponding to this wallet's network. */
  currentChain?: Chain;
  chainName?: string;
  disconnect: () => Promise<void>;
};

export type UseWhiskAccountResult = {
  /**
   * EVM account — always populated (with `isConnected: false` when no
   * wallet is connected) because the WagmiProvider is always mounted.
   */
  evm: WhiskAccountInfo;
  /**
   * Solana account — populated only when the dev added `solana()` to
   * config and a Solana wallet is available; otherwise an inert
   * disconnected stub.
   */
  solana: WhiskAccountInfo;
  /**
   * The account that matches a given chain. EVM source chains map to
   * `evm`; Solana source chains map to `solana`. UI components call
   * this with the active source chain to render the right account.
   */
  accountFor: (chain: Chain) => WhiskAccountInfo;
  /**
   * Whichever account is currently connected. EVM wins if both are.
   * Used by the top-of-card account chip when the source chain is
   * still being chosen.
   */
  primary: WhiskAccountInfo | undefined;
  /**
   * `true` when the wallet's actively-connected EVM chain doesn't match
   * `target`. Returns `false` for Solana targets — Solana doesn't have
   * the equivalent of `wallet_switchEthereumChain`.
   */
  isWrongChain: (target: Chain) => boolean;
  /**
   * Programmatically switch the EVM wallet's network. No-op for Solana
   * targets.
   */
  switchChain: (target: Chain) => Promise<void>;
};

/**
 * Single source of truth for connected-wallet state. Wraps wagmi's hooks
 * for EVM and `@solana/wallet-adapter-react`'s `useWallet` for Solana,
 * exposing a unified shape so UI components never branch on the
 * underlying ecosystem.
 */
export function useWhiskAccount(): UseWhiskAccountResult {
  /* ── EVM ─────────────────────────────────────────────────────────── */
  const { address: evmAddress, connector, status } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { disconnectAsync } = useDisconnect();

  const evmConnected = status === "connected" && !!evmAddress;
  const evmChainInfo = useMemo(
    () => (evmConnected ? chainByEvmId(chainId) : undefined),
    [evmConnected, chainId],
  );

  const evm: WhiskAccountInfo = useMemo(
    () => ({
      isConnected: evmConnected,
      isConnecting: status === "connecting" || status === "reconnecting",
      address: evmAddress,
      kind: "evm",
      connectorName: connector?.name,
      chainId: evmConnected ? chainId : undefined,
      currentChain: evmChainInfo?.chain,
      chainName: evmChainInfo?.label,
      disconnect: async () => {
        await disconnectAsync();
      },
    }),
    [
      evmConnected,
      status,
      evmAddress,
      connector,
      chainId,
      evmChainInfo,
      disconnectAsync,
    ],
  );

  /* ── Solana ──────────────────────────────────────────────────────── */
  const sol = useSolanaAccount();

  const solana: WhiskAccountInfo = useMemo(
    () => ({
      isConnected: sol.isConnected,
      isConnecting: sol.isConnecting,
      address: sol.address,
      kind: "solana",
      connectorName: sol.connectorName,
      currentChain: sol.currentChain,
      chainName: sol.currentChain
        ? chainInfo(sol.currentChain).label
        : undefined,
      disconnect: sol.disconnect,
    }),
    [sol],
  );

  /* ── Helpers ─────────────────────────────────────────────────────── */
  const accountFor = useCallback(
    (chain: Chain): WhiskAccountInfo => {
      const info = chainInfo(chain);
      return info.kind === "solana" ? solana : evm;
    },
    [evm, solana],
  );

  const primary = evm.isConnected
    ? evm
    : solana.isConnected
      ? solana
      : undefined;

  const isWrongChain = useCallback(
    (target: Chain) => {
      const info = chainInfo(target);
      if (info.kind !== "evm" || info.evmChainId == null) return false;
      if (!evmConnected || chainId == null) return false;
      return info.evmChainId !== chainId;
    },
    [evmConnected, chainId],
  );

  const switchChain = useCallback(
    async (target: Chain) => {
      const info = chainInfo(target);
      if (info.kind !== "evm" || info.evmChainId == null) return;
      // Pass `addEthereumChainParameter` so MetaMask offers to add the
      // network if it's not already configured. Without this, switching
      // to a long-tail chain hard-fails on first use.
      const viem = viemChainForWhisk(target);
      const addParam = viem
        ? {
            chainName: viem.name,
            nativeCurrency: viem.nativeCurrency,
            rpcUrls: viem.rpcUrls.default.http as readonly string[],
            blockExplorerUrls: viem.blockExplorers?.default
              ? [viem.blockExplorers.default.url]
              : undefined,
          }
        : undefined;
      await switchChainAsync({
        chainId: info.evmChainId,
        ...(addParam ? { addEthereumChainParameter: addParam } : {}),
      });
    },
    [switchChainAsync],
  );

  return {
    evm,
    solana,
    accountFor,
    primary,
    isWrongChain,
    switchChain,
  };
}
