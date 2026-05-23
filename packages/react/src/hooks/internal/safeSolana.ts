"use client";

import {
  useConnection,
  useWallet,
  type WalletContextState,
} from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";

/**
 * `useWallet` returns a sentinel when no `<WalletProvider>` is mounted, with
 * getters on `wallets` / `wallet` / `publicKey` that log to `console.error`
 * on read. Detect via property descriptor (no read fires the getter).
 */
export function safeUseWallet(): WalletContextState | undefined {
  const ctx = useWallet();
  if (!isRealWalletContext(ctx)) return undefined;
  return ctx;
}

/** `useConnection` throws outside `<ConnectionProvider>`, hence the try/catch. */
export function safeUseConnection(): Connection | undefined {
  try {
    return useConnection().connection;
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isRealWalletContext(ctx: any): boolean {
  if (!ctx) return false;
  // Sentinel installs `wallets` as an accessor; real provider as a data property.
  const desc = Object.getOwnPropertyDescriptor(ctx, "wallets");
  if (!desc) return false;
  return typeof desc.get !== "function";
}
