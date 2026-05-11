"use client";

import { useMemo } from "react";
import type { Chain } from "@signordev/whisk-core";
import { safeUseWallet } from "./internal/safeSolana.js";

export type UseSolanaAccountResult = {
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  connectorName?: string;
  /**
   * Whisk Chain — Solana on mainnet, Solana_Devnet otherwise. The widget
   * resolves the active Solana network from the cluster the dev
   * configured in `solana()`, since wallet-adapter doesn't expose a
   * "current network" — the Connection's endpoint determines it.
   */
  currentChain?: Chain;
  disconnect: () => Promise<void>;
};

/**
 * Solana-specific account state. Returns inert defaults when called
 * outside a `<WalletProvider>` (i.e. when `solana()` isn't in the
 * Whisk config), so it's safe to use unconditionally from
 * `useWhiskAccount`.
 */
export function useSolanaAccount(): UseSolanaAccountResult {
  const walletCtx = safeUseWallet();

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
      disconnect: () => walletCtx.disconnect(),
    };
  }, [walletCtx]);
}
