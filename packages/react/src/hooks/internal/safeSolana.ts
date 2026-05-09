"use client";

import {
  useConnection,
  useWallet,
  type WalletContextState,
} from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";

/**
 * `useWallet` from `@solana/wallet-adapter-react` returns a sentinel
 * context object when no `<WalletProvider>` is mounted. The sentinel
 * installs accessor getters on `wallets`, `wallet`, and `publicKey`
 * that call `console.error` on read — Next.js dev mode surfaces those
 * as "Console Error" entries even though nothing actually throws.
 *
 * Detecting absence by probing a property is therefore a trap:
 *
 *   - `connected`, `connecting`, etc. are plain `false` values on the
 *     sentinel → reading them doesn't fire the logger but also doesn't
 *     reveal the sentinel.
 *   - `wallets`, `wallet`, `publicKey` are getters → reading them DOES
 *     fire the logger, which is exactly the noise we want to avoid.
 *
 * Workaround: use `Object.getOwnPropertyDescriptor` to inspect whether
 * `wallets` is a data property (real provider — `WalletProvider` sets
 * `wallets: Wallet[]` directly) or an accessor (sentinel — defined via
 * `Object.defineProperty` with a getter). No property *read* happens,
 * so the error never logs, and we still get a reliable "is the provider
 * mounted?" answer.
 */
export function safeUseWallet(): WalletContextState | undefined {
  const ctx = useWallet();
  if (!isRealWalletContext(ctx)) return undefined;
  return ctx;
}

/**
 * Same trick for `useConnection`. `useConnection` itself throws when
 * called outside `<ConnectionProvider>` (different pattern from
 * `useWallet`'s console-error sentinel), so the call has to live inside
 * a try/catch. Hook is still always invoked, satisfying the rules of
 * hooks.
 */
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
  // The sentinel installs `wallets` as an accessor (get + no value).
  // Real WalletProvider assigns it as a normal data property.
  const desc = Object.getOwnPropertyDescriptor(ctx, "wallets");
  if (!desc) return false;
  return typeof desc.get !== "function";
}
