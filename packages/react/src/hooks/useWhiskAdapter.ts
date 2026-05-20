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

export function useWhiskAdapter(
  sourceChain: Chain | undefined,
): WhiskAdapter | null {
  const info = sourceChain ? chainInfo(sourceChain) : undefined;
  const isSolanaSource = info?.kind === "solana";

  const { address: evmAddress, connector, status } = useAccount();

  const solanaWallet: WalletContextState | undefined = safeUseWallet();
  const solanaConnection: Connection | undefined = safeUseConnection();

  // `@solana/wallet-adapter-react`'s context returns a fresh object on every
  // parent render. Depending on it directly caused the adapter to rebuild
  // each render, briefly nulling out and silently no-op'ing the user's click
  // ("Review needs two clicks" bug, Solana-only). Depend on scalar derivatives.
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

// Bypass `createSolanaKitAdapterFromProvider`: its `TransactionSendingSigner`
// is excluded by App Kit's internal `partiallySignTransactionMessageWithSigners`
// (identifySendingSigner: false), so the fee payer never signs and
// `getSignatureFromTransaction` throws. We hand-build a `TransactionPartialSigner`
// (`signTransactions`) that translates between kit wire format and web3.js.
function buildSolanaAdapter(
  wallet: WalletContextState,
  connection: Connection,
  walletAddress: string,
): SolanaKitAdapter {
  return new SolanaKitAdapter(
    {
      // Cast bypasses kit's cluster-tagged RPC invariance; the host's `<ConnectionProvider>` carries the cluster.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getRpc: () => createSolanaRpc(connection.rpcEndpoint) as any,
      getSigner: async () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        buildSolanaPartialSigner(wallet, walletAddress) as any,
    },
    // Capabilities required — without them downstream throws "Adapter capabilities must be defined".
    {
      addressContext: "user-controlled",
      supportedChains: [Solana, SolanaDevnet],
    },
  );
}

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
