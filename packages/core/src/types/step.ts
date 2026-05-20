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
  txHash?: string;
  explorerUrl?: string;
  errorMessage?: string;
  errorCategory?: import("../errors/errors.js").WhiskErrorCategory;
  /** Step executed via Circle's Forwarder relay (mint steps only). */
  forwarded?: boolean;
};
