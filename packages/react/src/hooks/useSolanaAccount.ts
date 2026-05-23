"use client";

import { useMemo } from "react";
import type { Chain } from "@usewhisk/core";
import { safeUseConnection, safeUseWallet } from "./internal/safeSolana.js";

export type UseSolanaAccountResult = {
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  connectorName?: string;
  currentChain?: Chain;
  disconnect: () => Promise<void>;
};

/** Inert defaults when called outside a `<WalletProvider>`. */
export function useSolanaAccount(): UseSolanaAccountResult {
  const walletCtx = safeUseWallet();
  const connection = safeUseConnection();

  // wallet-adapter has no "current network" — derive from the Connection's
  // RPC endpoint (devnet/mainnet substring match).
  const currentChain: Chain | undefined = useMemo(() => {
    const endpoint = connection?.rpcEndpoint;
    if (!endpoint) return undefined;
    if (endpoint.includes("devnet")) return "Solana_Devnet";
    if (endpoint.includes("testnet")) return undefined;
    return "Solana";
  }, [connection?.rpcEndpoint]);

  return useMemo<UseSolanaAccountResult>(() => {
    if (!walletCtx) {
      return {
        isConnected: false,
        isConnecting: false,
        disconnect: async () => {},
      };
    }
    return {
      isConnected: walletCtx.connected,
      isConnecting: walletCtx.connecting,
      address: walletCtx.publicKey?.toBase58(),
      connectorName: walletCtx.wallet?.adapter.name,
      currentChain,
      disconnect: () => walletCtx.disconnect(),
    };
  }, [walletCtx, currentChain]);
}
