"use client";

import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Chain } from "@strimz/whisk-core";

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
  // useWallet returns a stable shape even when no provider is mounted —
  // it falls back to the default context which has nullable values for
  // every field. So this is safe in EVM-only configurations.
  let walletCtx: ReturnType<typeof useWallet> | undefined;
  try {
    walletCtx = useWallet();
  } catch {
    walletCtx = undefined;
  }

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
      // The widget doesn't currently know which Solana cluster is
      // active without consulting the Connection — defer that to the
      // chain picker. `currentChain` is undefined here; UI components
      // pick from the source chain selector.
      disconnect: () => walletCtx.disconnect(),
    };
  }, [walletCtx]);
}
