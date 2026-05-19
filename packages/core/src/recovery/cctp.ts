/**
 * Direct CCTP v2 MessageTransmitter recovery.
 *
 * The ultimate escape hatch: when both App Kit's normal bridge flow
 * and `engine.retry()` (which wraps `kit.retryBridge`) fail to land
 * the destination mint, we still have one option left — submit
 * `MessageTransmitter.receiveMessage(message, attestation)` directly
 * to the destination chain ourselves.
 *
 * This module returns a ready-to-submit call descriptor. It does NOT
 * sign or send anything itself; the React layer (which has access to
 * wagmi / wallet-adapter / viem) wraps this into an actual on-chain
 * call. Keeping the core pure means we don't need viem as a direct
 * dep, and tests stay fast.
 *
 * ## Replay safety
 *
 * CCTP v2 messages carry a unique `eventNonce` per source-side burn.
 * The destination MessageTransmitter tracks consumed nonces and
 * reverts duplicate submissions with `Nonce already used`. Submitting
 * the same `(message, attestation)` twice cannot result in a double
 * mint at the protocol level.
 *
 * ## Gas cost
 *
 * This call costs the same gas as the mint App Kit would have
 * submitted via the normal bridge or `retry` path. It's an
 * *alternative* path, not additive — we only ship the call when the
 * standard paths have failed. The user pays once, not twice.
 *
 * ## Address provenance
 *
 * Addresses are mirrored from `@circle-fin/app-kit/chains` (verified
 * against `chains.d.ts` on every release). CCTP v2 uses a canonical
 * address per network — `0x81D4…4B64` on every EVM mainnet,
 * `0xE737…CE275` on every EVM testnet, `CCTPV2Sm…` on Solana.
 */

import type { Chain } from "../types/chain.js";
import { chainInfo, explorerTxUrl } from "./../chains/registry.js";

/**
 * Canonical CCTP v2 MessageTransmitter on every EVM mainnet chain.
 *
 * Source: `@circle-fin/app-kit/chains` 1.5.1, verified across
 * Arbitrum, Avalanche, Base, Ethereum, Linea, Optimism, Polygon,
 * Sonic, Unichain, World Chain.
 */
export const EVM_MAINNET_MESSAGE_TRANSMITTER =
  "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64" as const;

/**
 * Canonical CCTP v2 MessageTransmitter on every EVM testnet chain.
 *
 * Source: `@circle-fin/app-kit/chains` 1.5.1.
 */
export const EVM_TESTNET_MESSAGE_TRANSMITTER =
  "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275" as const;

/**
 * CCTP v2 MessageTransmitter program ID on Solana (same address on
 * mainnet and devnet). Solana program IDs are network-agnostic — the
 * "network" is what RPC endpoint you point at, not which program.
 */
export const SOLANA_MESSAGE_TRANSMITTER =
  "CCTPV2Sm4AdWt5296sk4P66VBZ7bEhcARwFaaS9YPbeC" as const;

/**
 * Minimal ABI for `MessageTransmitter.receiveMessage`. Pure data,
 * no runtime cost. Consumers feed this to viem's
 * `encodeFunctionData` / wagmi's `useWriteContract`.
 */
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

/**
 * The shape a React/viem layer needs to submit a manual mint. A
 * caller passes this straight into wagmi's `writeContractAsync` (or
 * viem's `writeContract`) on the destination chain.
 *
 * `null` from the builder means we don't have a MessageTransmitter
 * registered for this chain — the caller should fall back to App
 * Kit's retry path and surface a clear error if that also fails.
 */
export type ReceiveMessageCall = {
  /** Destination chain the call must be signed on. */
  destinationChain: Chain;
  /** MessageTransmitter contract / program address. */
  address: string;
  /** Function ABI. Bind with `as const` so viem narrows the args type. */
  abi: typeof RECEIVE_MESSAGE_ABI;
  /** Always `"receiveMessage"`. */
  functionName: "receiveMessage";
  /** `[message, attestation]` as hex strings (0x-prefixed). */
  args: [string, string];
};

/**
 * Look up the MessageTransmitter address (or Solana program ID) for a
 * chain. Returns `undefined` if Whisk doesn't have one registered —
 * which means manual mint recovery isn't available for that chain.
 */
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
 * destination chain. Pair the result with the user's connected wallet
 * client (viem `writeContract`, wagmi `useWriteContract`, etc.) to
 * submit the manual mint.
 *
 * Returns `null` when:
 *
 *  - The chain isn't EVM-shaped (Solana support requires a different
 *    call surface — `@solana/web3.js` + the Solana program, deferred
 *    to a follow-up).
 *  - The chain has no MessageTransmitter registered.
 *
 * Will throw if `message` or `attestation` are missing or malformed
 * hex strings — those are required input from Iris (`pollAttestation`).
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
  // Solana manual mint requires a different call (program instruction,
  // not an EVM contract call). Out of scope for the EVM-only first cut.
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

/**
 * Helper for callers that want to surface a destination-side explorer
 * link to the user after submitting the manual mint. Pure formatting —
 * the actual receipt-waiting + tx-hash retrieval is the caller's job.
 */
export function manualMintExplorerUrl(
  destinationChain: Chain,
  txHash: string,
): string | undefined {
  return explorerTxUrl(destinationChain, txHash);
}
