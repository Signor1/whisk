"use client";

import { useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useConfig,
} from "wagmi";
import {
  buildReceiveMessageCall,
  chainInfo,
  fetchAttestationOnce,
  manualMintExplorerUrl,
  pollAttestation,
  type Chain,
  type IrisMessage,
} from "@signordev/whisk-core";

/**
 * Last-resort recovery: submit `MessageTransmitter.receiveMessage`
 * directly on the destination chain. Used when:
 *
 *   1. A bridge failed mid-flight (USDC burned, mint not landed)
 *   2. `engine.retry()` (App Kit's `retryBridge`) also failed
 *   3. Iris confirms the attestation IS available
 *
 * The flow this hook drives is read-only first (poll Iris), then a
 * single on-chain call to MessageTransmitter on the destination. The
 * user signs ONCE — no extra burn, no extra approve.
 *
 * Gas cost matches what App Kit would have submitted on the user's
 * behalf via the forwarder/retry path. This isn't *additional* gas;
 * it's the *same* mint, just submitted directly instead of through
 * App Kit. CCTP v2's nonce tracking on the destination
 * MessageTransmitter guarantees the same `(message, attestation)`
 * can't be replayed.
 *
 * Solana destinations aren't supported by this hook — Solana's
 * MessageTransmitter is a program with a different call surface
 * (`@solana/web3.js` instructions). When the destination is Solana,
 * `manualMint` returns `{ kind: "unsupported" }` and the UI should
 * fall back to the attestation-copy escape hatch.
 */
export type ManualMintInput = {
  destinationChain: Chain;
  /**
   * Iris-issued message + attestation. If omitted, the hook polls
   * Iris using the burn tx hash from the source chain to fetch them.
   */
  message?: string;
  attestation?: string;
  /**
   * Source-side burn tx hash. Required when `message` and `attestation`
   * are omitted, so the hook can poll Iris for them.
   */
  burnSourceChain?: Chain;
  burnTxHash?: string;
  /** Total poll timeout for the Iris fetch (ms). Default 10 min. */
  pollTimeout?: number;
};

export type ManualMintResult =
  | {
      kind: "success";
      txHash: string;
      explorerUrl?: string;
    }
  | {
      kind: "failure";
      reason: "no-attestation" | "unsupported-chain" | "submission-failed";
      message: string;
    }
  | {
      kind: "unsupported";
      reason: "solana-destination" | "no-message-transmitter";
    };

export type UseManualMintResult = {
  manualMint: (input: ManualMintInput) => Promise<ManualMintResult>;
  /** Best-effort live status from Iris — useful for a polling spinner. */
  fetchAttestation: (
    sourceChain: Chain,
    burnTxHash: string,
  ) => Promise<IrisMessage>;
};

export function useManualMint(): UseManualMintResult {
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();

  const manualMint = useCallback(
    async (input: ManualMintInput): Promise<ManualMintResult> => {
      const destInfo = chainInfo(input.destinationChain);

      // Solana destinations need a different call path — out of scope
      // for the EVM-only first cut. Surface a clear "unsupported"
      // signal so the UI can fall back to the attestation-copy
      // escape hatch.
      if (destInfo.kind !== "evm") {
        return { kind: "unsupported", reason: "solana-destination" };
      }
      if (destInfo.evmChainId === undefined) {
        return { kind: "unsupported", reason: "no-message-transmitter" };
      }

      // Resolve message + attestation. If the caller passed them, use
      // them. Otherwise poll Iris with the burn tx hash.
      let message = input.message;
      let attestation = input.attestation;
      if (!message || !attestation) {
        if (!input.burnSourceChain || !input.burnTxHash) {
          return {
            kind: "failure",
            reason: "no-attestation",
            message:
              "Provide (message + attestation) or (burnSourceChain + burnTxHash).",
          };
        }
        const polled = await pollAttestation(
          input.burnSourceChain,
          input.burnTxHash,
          { timeout: input.pollTimeout ?? 10 * 60 * 1000 },
        );
        if (
          polled.status !== "complete" ||
          !polled.message ||
          !polled.attestation
        ) {
          return {
            kind: "failure",
            reason: "no-attestation",
            message: `Iris status: ${polled.status}. Attestation not available.`,
          };
        }
        message = polled.message;
        attestation = polled.attestation;
      }

      // Build the contract call descriptor. Returns null if we don't
      // have a MessageTransmitter for this chain.
      const call = buildReceiveMessageCall(
        input.destinationChain,
        message,
        attestation,
      );
      if (!call) {
        return { kind: "unsupported", reason: "no-message-transmitter" };
      }

      try {
        // Submit via wagmi — this prompts the connected wallet for a
        // signature on the destination chain. wagmi will refuse if the
        // wallet isn't on the right chain, which is the right
        // behaviour: a misrouted manual mint is the kind of thing we
        // never want to ship to the wrong chain by accident.
        const txHash = await writeContractAsync({
          address: call.address as `0x${string}`,
          abi: call.abi,
          functionName: call.functionName,
          args: [call.args[0] as `0x${string}`, call.args[1] as `0x${string}`],
          chainId: destInfo.evmChainId,
        });

        return {
          kind: "success",
          txHash,
          explorerUrl: manualMintExplorerUrl(input.destinationChain, txHash),
        };
      } catch (err) {
        return {
          kind: "failure",
          reason: "submission-failed",
          message: err instanceof Error ? err.message : String(err),
        };
      }
    },
    [writeContractAsync],
  );

  const fetch = useCallback(
    (sourceChain: Chain, burnTxHash: string) =>
      fetchAttestationOnce(sourceChain, burnTxHash),
    [],
  );

  // Reference wagmiConfig + useWaitForTransactionReceipt to silence
  // "unused import" linting while keeping the imports stable for the
  // next iteration (where we'll add `waitForReceipt` to the success
  // branch so the caller gets a confirmed tx hash, not just submitted).
  void wagmiConfig;
  void useWaitForTransactionReceipt;

  return { manualMint, fetchAttestation: fetch };
}
