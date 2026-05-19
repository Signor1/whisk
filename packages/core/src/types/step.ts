/**
 * The lifecycle steps Whisk surfaces during a transfer.
 *
 * - `approve`: ERC-20 allowance grant on the source chain (EVM only, when
 *   the wallet has not yet approved spending).
 * - `transfer`: Same-chain send. Final step for `send` routes.
 * - `burn`: Cross-chain CCTP burn on the source chain.
 * - `fetchAttestation`: Wait for Circle to sign the burn proof.
 * - `mint`: Mint USDC on the destination chain.
 *
 * The names line up exactly with App Kit's `BridgeStep["name"]` so values
 * pass through without translation.
 */
export type StepName =
  | "approve"
  | "transfer"
  | "burn"
  | "fetchAttestation"
  | "mint";

export type StepState = "pending" | "success" | "error" | "noop";

export type Step = {
  name: StepName;
  state: StepState;
  /** Transaction hash on the relevant chain, if applicable. */
  txHash?: string;
  /** Block-explorer URL for `txHash` (pre-formatted by App Kit). */
  explorerUrl?: string;
  /** Human-readable error if the step failed. */
  errorMessage?: string;
  /**
   * Machine-readable failure category mirrored from App Kit's
   * `BridgeStep.errorCategory`. See `WhiskErrorCategory` in
   * `../errors/errors` for the value list. Present only when the
   * step is in `state: "error"`.
   */
  errorCategory?: import("../errors/errors.js").WhiskErrorCategory;
  /**
   * Whether this step was executed via Circle's Forwarder relay rather than
   * a locally-signed transaction. `mint` steps only.
   */
  forwarded?: boolean;
};
