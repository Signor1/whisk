"use client";

import { useCallback, useMemo } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { chainByEvmId, chainInfo, type Chain } from "@signordev/whisk-core";
import { viemChainForWhisk } from "../config/adapters/evm.js";
import { useSolanaAccount } from "./useSolanaAccount.js";

export type WhiskAccountInfo = {
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  kind: "evm" | "solana";
  connectorName?: string;
  /** EVM only — undefined for Solana. */
  chainId?: number;
  currentChain?: Chain;
  chainName?: string;
  disconnect: () => Promise<void>;
};

export type UseWhiskAccountResult = {
  evm: WhiskAccountInfo;
  solana: WhiskAccountInfo;
  accountFor: (chain: Chain) => WhiskAccountInfo;
  /** EVM wins when both ecosystems are connected. */
  primary: WhiskAccountInfo | undefined;
  /** Always false for Solana targets — no `wallet_switchEthereumChain` equivalent. */
  isWrongChain: (target: Chain) => boolean;
  switchChain: (target: Chain) => Promise<void>;
};

export function useWhiskAccount(): UseWhiskAccountResult {
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
      // Pass `addEthereumChainParameter` so MetaMask can add unknown long-tail chains.
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
