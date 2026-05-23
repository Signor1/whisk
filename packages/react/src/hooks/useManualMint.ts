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
} from "@usewhisk/core";

/** Last-resort: submit `MessageTransmitter.receiveMessage` directly. CCTP v2 nonces prevent replay. */
export type ManualMintInput = {
  destinationChain: Chain;
  /** If omitted, the hook polls Iris using `burnSourceChain` + `burnTxHash`. */
  message?: string;
  attestation?: string;
  burnSourceChain?: Chain;
  burnTxHash?: string;
  /** Default 10 min. */
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

      if (destInfo.kind !== "evm") {
        return { kind: "unsupported", reason: "solana-destination" };
      }
      if (destInfo.evmChainId === undefined) {
        return { kind: "unsupported", reason: "no-message-transmitter" };
      }

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

      const call = buildReceiveMessageCall(
        input.destinationChain,
        message,
        attestation,
      );
      if (!call) {
        return { kind: "unsupported", reason: "no-message-transmitter" };
      }

      try {
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

  void wagmiConfig;
  void useWaitForTransactionReceipt;

  return { manualMint, fetchAttestation: fetch };
}
