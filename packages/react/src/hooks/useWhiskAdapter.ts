"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { type WalletContextState } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { VersionedTransaction, VersionedMessage } from "@solana/web3.js";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { SolanaKitAdapter } from "@circle-fin/adapter-solana-kit";
import { Solana, SolanaDevnet } from "@circle-fin/app-kit/chains";
import { address as kitAddress, createSolanaRpc } from "@solana/kit";
import {
  chainInfo,
  type Chain,
  type WhiskAdapter,
} from "@signordev/whisk-core";
import { safeUseConnection, safeUseWallet } from "./internal/safeSolana.js";

/**
 * Bridge wagmi or Solana wallet-adapter into a `WhiskAdapter` the engine
 * understands. Picks the correct ecosystem based on the source chain
 * the consumer is operating on.
 *
 * - EVM source → wagmi connector → App Kit's `createViemAdapterFromProvider`.
 * - Solana source → wallet-adapter wallet → a `SolanaKitAdapter` with a
 *   hand-built kit-compatible signer (see `buildSolanaPartialSigner`
 *   below for why we don't use App Kit's stock provider factory).
 *
 * Re-builds the adapter only when the underlying connection or source
 * ecosystem changes. Account / chain switches surface as new
 * `WhiskAdapter` instances so the engine sees the right signer.
 */
export function useWhiskAdapter(
  sourceChain: Chain | undefined,
): WhiskAdapter | null {
  const info = sourceChain ? chainInfo(sourceChain) : undefined;
  const isSolanaSource = info?.kind === "solana";

  const { address: evmAddress, connector, status } = useAccount();

  // Safe wrappers — both return `undefined` instead of throwing when
  // the dev didn't add `solana()` to their config (no provider mounted).
  const solanaWallet: WalletContextState | undefined = safeUseWallet();
  const solanaConnection: Connection | undefined = safeUseConnection();

  /* -------------------------------------------------------------------- *
   * Stability over reference equality                                     *
   *                                                                       *
   * `@solana/wallet-adapter-react`'s context returns a fresh                *
   * `WalletContextState` reference on essentially every render of the      *
   * parent provider, even when nothing meaningful changed. Treating that   *
   * object as a `useEffect` dependency caused the adapter to be torn       *
   * down and rebuilt on every render — which created a brief window per   *
   * render where `adapter === null`. The user's click on "Send" would      *
   * land in that window, the action would silently no-op (it has a        *
   * `!adapter` guard), and they'd have to click again. Hence "Review       *
   * needs two clicks" — only on Solana, because the wagmi-side deps        *
   * (`connector`, `evmAddress`, `status`) are reference-stable.            *
   *                                                                       *
   * Fix: depend on scalar derivatives that DO have stable identity        *
   * (publicKey as a base58 string, connected as a boolean, the connection  *
   * URL as a string). Keep the live wallet/connection objects in refs so   *
   * `build()` can still use them when it actually runs.                    *
   * -------------------------------------------------------------------- */
  const solanaPublicKey = solanaWallet?.publicKey?.toBase58();
  const solanaConnected = Boolean(solanaWallet?.connected);
  const solanaEndpoint = solanaConnection?.rpcEndpoint;
  const walletRef = useRef(solanaWallet);
  walletRef.current = solanaWallet;
  const connectionRef = useRef(solanaConnection);
  connectionRef.current = solanaConnection;

  const [adapter, setAdapter] = useState<WhiskAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function build(): Promise<WhiskAdapter | null> {
      if (isSolanaSource) {
        const wallet = walletRef.current;
        const connection = connectionRef.current;
        if (!wallet?.connected || !wallet.publicKey) return null;
        if (!connection) return null;
        const address = wallet.publicKey.toBase58();
        const appKitAdapter = buildSolanaAdapter(wallet, connection, address);
        return {
          appKitAdapter:
            appKitAdapter as unknown as WhiskAdapter["appKitAdapter"],
          kind: "solana",
          address,
        };
      }

      // EVM path
      if (status !== "connected" || !connector || !evmAddress) return null;
      const provider = await connector.getProvider();
      const appKitAdapter = await createViemAdapterFromProvider({
        provider: provider as Parameters<
          typeof createViemAdapterFromProvider
        >[0]["provider"],
      });
      return { appKitAdapter, kind: "evm", address: evmAddress };
    }

    (async () => {
      try {
        const next = await build();
        if (!cancelled) setAdapter(next);
      } catch {
        if (!cancelled) setAdapter(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isSolanaSource,
    status,
    connector,
    evmAddress,
    solanaPublicKey,
    solanaConnected,
    solanaEndpoint,
  ]);

  return adapter;
}

/* -------------------------------------------------------------------------- */
/*  Solana adapter construction                                                */
/*                                                                            */
/*  Why we bypass `createSolanaKitAdapterFromProvider`:                        */
/*                                                                            */
/*  App Kit's stock factory wraps the provider as a kit                       */
/*  `TransactionSendingSigner` (only `signAndSendTransactions`). But App Kit's */
/*  internal `executeTransaction` calls                                        */
/*  `partiallySignTransactionMessageWithSigners` from `@solana/signers`,       */
/*  which **explicitly excludes sending signers** (`identifySendingSigner:      */
/*  false`). The fee payer therefore never signs, the resulting tx has no      */
/*  signatures, and `getSignatureFromTransaction` throws "Could not determine  */
/*  this transaction's signature." That's the bug the user kept hitting on     */
/*  Solana → Solana sends.                                                     */
/*                                                                            */
/*  Workaround: construct `SolanaKitAdapter` directly and feed it a            */
/*  hand-built `TransactionPartialSigner` (one with `signTransactions`). The   */
/*  signer translates between kit's wire format and the wallet-adapter-react   */
/*  wallet's web3.js `VersionedTransaction`-based API.                         */
/* -------------------------------------------------------------------------- */

function buildSolanaAdapter(
  wallet: WalletContextState,
  connection: Connection,
  walletAddress: string,
): SolanaKitAdapter {
  return new SolanaKitAdapter(
    {
      // The kit's RPC types branch on cluster (`RpcDevnet`, `RpcTestnet`,
      // `RpcMainnet`). We don't pin a cluster up front — the host's
      // `<ConnectionProvider>` already does — so cast through `any` to
      // bypass the cluster-tag invariance. `connection.rpcEndpoint` is
      // what carries the actual cluster information.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getRpc: () => createSolanaRpc(connection.rpcEndpoint) as any,
      getSigner: async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildSolanaPartialSigner(wallet, walletAddress) as any,
    },
    // Capabilities are required — the constructor leaves them undefined
    // when omitted, and downstream code throws "Adapter capabilities must
    // be defined" the first time it's queried. Match the shape App Kit's
    // own `createSolanaKitAdapterFromProvider` factory uses.
    {
      addressContext: "user-controlled",
      supportedChains: [Solana, SolanaDevnet],
    },
  );
}

/**
 * Build a `TransactionPartialSigner` (kit-style) backed by a
 * wallet-adapter-react wallet. Implements the single method
 * `signTransactions` so kit's `partiallySignTransactionMessageWithSigners`
 * picks it up.
 *
 * Kit hands us `{ messageBytes, signatures }` objects — the message is the
 * compiled wire format. We deserialise it into a web3.js
 * `VersionedTransaction`, ask the wallet to sign, then read the fee-payer
 * signature out of `signatures[0]` and return it in kit's address-keyed
 * map shape.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSolanaPartialSigner(
  wallet: WalletContextState,
  walletAddress: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  const sAddr = kitAddress(walletAddress);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sign = wallet.signTransaction as
    | undefined
    | ((tx: any) => Promise<any>);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signMsg = wallet.signMessage as
    | undefined
    | ((m: Uint8Array) => Promise<Uint8Array>);

  if (!sign) {
    throw new Error(
      "Connected Solana wallet does not implement signTransaction.",
    );
  }

  return {
    address: sAddr,
    /**
     * Sign each transaction by:
     *   messageBytes → VersionedMessage → VersionedTransaction →
     *   wallet.signTransaction → take signatures[0] (the fee-payer's).
     *
     * Returns one signatures map per tx, address-keyed, as kit expects.
     */
    signTransactions: async (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      txs: ReadonlyArray<{ messageBytes: Uint8Array; signatures: any }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Promise<any[]> => {
      const out: Record<string, Uint8Array>[] = [];
      for (const kitTx of txs) {
        const message = VersionedMessage.deserialize(kitTx.messageBytes);
        const versionedTx = new VersionedTransaction(message);
        const signed: VersionedTransaction = await sign(versionedTx);
        const sig = signed.signatures[0];
        if (!sig || sig.length !== 64) {
          throw new Error(
            "Wallet returned a transaction without a fee-payer signature.",
          );
        }
        out.push({ [sAddr as unknown as string]: sig });
      }
      return out;
    },
    signMessages: signMsg
      ? async (
          messages: ReadonlyArray<{ content: Uint8Array }>,
        ): Promise<Record<string, Uint8Array>[]> => {
          const out: Record<string, Uint8Array>[] = [];
          for (const m of messages) {
            const sig = await signMsg(m.content);
            out.push({ [sAddr as unknown as string]: sig });
          }
          return out;
        }
      : undefined,
  };
}
