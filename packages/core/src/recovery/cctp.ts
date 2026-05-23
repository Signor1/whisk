import type { Chain } from "../types/chain.js";
import { chainInfo, explorerTxUrl } from "./../chains/registry.js";

// Canonical CCTP v2 MessageTransmitter addresses, mirrored from
// @circle-fin/app-kit/chains. Circle uses the same address across
// every chain of a given network.
export const EVM_MAINNET_MESSAGE_TRANSMITTER =
  "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as const;
export const EVM_TESTNET_MESSAGE_TRANSMITTER =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;
export const SOLANA_MESSAGE_TRANSMITTER =
  "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC" as const;

export const RECEIVE_MESSAGE_ABI = [
  {
    type: "function",
    name: "receiveMessage",
    stateMutability: "nonpayable",
    inputs: [
      { name: "message", type: "bytes" },
      { name: "attestation", type: "bytes" },
    ],
    outputs: [{ name: "success", type: "bool" }],
  },
] as const;

export type ReceiveMessageCall = {
  destinationChain: Chain;
  address: string;
  abi: typeof RECEIVE_MESSAGE_ABI;
  functionName: "receiveMessage";
  args: [string, string];
};

export function messageTransmitterAddress(chain: Chain): string | undefined {
  const info = chainInfo(chain);
  if (info.kind === "solana") return SOLANA_MESSAGE_TRANSMITTER;
  if (info.kind === "evm") {
    return info.network === "mainnet"
      ? EVM_MAINNET_MESSAGE_TRANSMITTER
      : EVM_TESTNET_MESSAGE_TRANSMITTER;
  }
  return undefined;
}

/**
 * Build a `MessageTransmitter.receiveMessage` call descriptor for the
 * destination chain. Returns `null` for Solana destinations (different
 * call surface, not yet implemented) or chains without a registered
 * MessageTransmitter. Throws on malformed hex inputs.
 */
export function buildReceiveMessageCall(
  destinationChain: Chain,
  message: string,
  attestation: string,
): ReceiveMessageCall | null {
  if (!message || !message.startsWith("0x")) {
    throw new TypeError(
      "buildReceiveMessageCall: `message` must be a 0x-prefixed hex string",
    );
  }
  if (!attestation || !attestation.startsWith("0x")) {
    throw new TypeError(
      "buildReceiveMessageCall: `attestation` must be a 0x-prefixed hex string",
    );
  }
  const info = chainInfo(destinationChain);
  if (info.kind !== "evm") return null;

  const address = messageTransmitterAddress(destinationChain);
  if (!address) return null;

  return {
    destinationChain,
    address,
    abi: RECEIVE_MESSAGE_ABI,
    functionName: "receiveMessage",
    args: [message, attestation],
  };
}

export function manualMintExplorerUrl(
  destinationChain: Chain,
  txHash: string,
): string | undefined {
  return explorerTxUrl(destinationChain, txHash);
}
