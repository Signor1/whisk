"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  useConnection,
  useWallet,
  type WalletContextState,
} from "@solana/wallet-adapter-react";
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
} from "@strimz/whisk-core";

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

  let solanaWallet: WalletContextState | undefined;
  let solanaConnection: Connection | undefined;
  try {
    solanaWallet = useWallet();
  } catch {
    solanaWallet = undefined;
  }
  try {
    solanaConnection = useConnection().connection;
  } catch {
    solanaConnection = undefined;
  }

  const [adapter, setAdapter] = useState<WhiskAdapter | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function build(): Promise<WhiskAdapter | null> {
      if (isSolanaSource) {
        if (!solanaWallet?.connected || !solanaWallet.publicKey) return null;
        if (!solanaConnection) return null;
        const address = solanaWallet.publicKey.toBase58();
        const appKitAdapter = buildSolanaAdapter(
          solanaWallet,
          solanaConnection,
          address,
        );
        return {
          appKitAdapter: appKitAdapter as unknown as WhiskAdapter["appKitAdapter"],
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
    solanaWallet,
    solanaConnection,
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
  const sign = wallet.signTransaction as undefined | ((tx: any) => Promise<any>);
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
