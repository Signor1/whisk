import type { StepName } from "../types/step.js";

/**
 * Whisk emits one error class for every distinct failure mode so consumers
 * can `instanceof` or `switch` on `code` instead of parsing message strings.
 *
 * `retryable` is the single most useful field for UIs: it answers "should I
 * show a Retry button?" without any further inspection.
 */
export type WhiskErrorCode =
  /** No wallet adapter is connected — UI should prompt connect. */
  | "NO_ADAPTER"
  /** Adapter connected but on the wrong chain. */
  | "WRONG_CHAIN"
  /** Source wallet does not have enough USDC (or native gas). */
  | "INSUFFICIENT_BALANCE"
  /** Recipient input could not be parsed as any supported format. */
  | "INVALID_ADDRESS"
  /** A resolver matched but failed to resolve (ENS doesn't exist, etc.). */
  | "RESOLVER_FAILED"
  /** A specific step in the bridge state machine errored. */
  | "BRIDGE_STEP_FAILED"
  /** User explicitly rejected the wallet popup. */
  | "USER_REJECTED"
  /** Transient network / RPC error. Retryable by default. */
  | "NETWORK_ERROR"
  /** Wallet capability mismatch (EIP-5792 atomic batch not supported, etc.). */
  | "WALLET_CAPABILITY"
  /** Onchain revert — gas paid, tx mined, instruction failed. */
  | "ONCHAIN_REVERT"
  /** Misconfiguration — surfaced to the developer, not the end user. */
  | "CONFIG_ERROR"
  /** Catch-all for anything else. */
  | "UNKNOWN";

/**
 * Machine-readable error classification mirrored from App Kit's
 * `BridgeStepErrorCategory` (App Kit 1.4.2+, adapter-viem-v2 1.9.0+).
 * Use this on `WhiskError.category` to switch on failure cause without
 * string-matching `error.message`.
 *
 * Categories Circle defines today:
 *
 * - `user_rejected` — user cancelled the wallet popup. No funds at risk;
 *   silent abort is usually the right UX.
 * - `atomic_unsupported` — wallet rejected EIP-5792 `wallet_sendCalls`.
 * - `batch_too_large` — wallet enforces a per-batch call cap.
 * - `duplicate_batch_id` — the same batch was submitted twice.
 * - `unknown_bundle` — wallet doesn't recognise the batch id we polled.
 * - `polling_timeout` — `wallet_getCallsStatus` didn't reach a terminal
 *   status within the adapter's window. May still be confirmed on chain.
 * - `failed_offchain` — failed before submission (signer, encoding, etc.).
 * - `reverted_onchain` — mined and reverted on chain.
 * - `partial_reverted` — batched call where some sub-calls reverted.
 * - `chain_revert` — chain-level revert (reorg, dropped, etc.).
 * - `unknown` — Circle couldn't categorize.
 */
export type WhiskErrorCategory =
  | "user_rejected"
  | "atomic_unsupported"
  | "batch_too_large"
  | "duplicate_batch_id"
  | "unknown_bundle"
  | "polling_timeout"
  | "failed_offchain"
  | "reverted_onchain"
  | "partial_reverted"
  | "chain_revert"
  | "unknown";

export interface WhiskErrorOptions {
  code: WhiskErrorCode;
  message: string;
  retryable?: boolean;
  step?: StepName;
  /** Machine-readable category mirrored from App Kit, when available. */
  category?: WhiskErrorCategory;
  cause?: unknown;
}

export class WhiskError extends Error {
  readonly code: WhiskErrorCode;
  readonly retryable: boolean;
  readonly step?: StepName;
  readonly category?: WhiskErrorCategory;
  override readonly cause?: unknown;

  constructor(opts: WhiskErrorOptions) {
    super(opts.message);
    this.name = "WhiskError";
    this.code = opts.code;
    this.retryable = opts.retryable ?? false;
    this.step = opts.step;
    this.category = opts.category;
    this.cause = opts.cause;
    // Maintain prototype chain for `instanceof` after transpilation.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/* -------------------------------------------------------------------------- */
/*  Specific subclasses                                                        */
/*                                                                            */
/*  Each subclass exists for ergonomics — `throw new NoAdapterError()` is     */
/*  shorter than passing every option to the base constructor. Subclasses     */
/*  also let UI layers narrow the type with `instanceof` without `code`       */
/*  comparisons.                                                              */
/* -------------------------------------------------------------------------- */

export class NoAdapterError extends WhiskError {
  constructor(message = "No wallet adapter connected.", cause?: unknown) {
    super({ code: "NO_ADAPTER", message, retryable: false, cause });
    this.name = "NoAdapterError";
  }
}

export class WrongChainError extends WhiskError {
  constructor(
    public readonly expectedChain: string,
    cause?: unknown,
  ) {
    super({
      code: "WRONG_CHAIN",
      message: `Connected wallet is on the wrong chain. Expected: ${expectedChain}.`,
      retryable: true,
      cause,
    });
    this.name = "WrongChainError";
  }
}

export class InsufficientBalanceError extends WhiskError {
  constructor(
    public readonly required: string,
    public readonly available: string,
    public readonly token: string,
    cause?: unknown,
  ) {
    super({
      code: "INSUFFICIENT_BALANCE",
      message: `Insufficient ${token}. Need ${required}, have ${available}.`,
      retryable: false,
      cause,
    });
    this.name = "InsufficientBalanceError";
  }
}

export class InvalidAddressError extends WhiskError {
  constructor(
    public readonly input: string,
    cause?: unknown,
  ) {
    super({
      code: "INVALID_ADDRESS",
      message: `"${input}" is not a recognised address or supported recipient format.`,
      retryable: false,
      cause,
    });
    this.name = "InvalidAddressError";
  }
}

export class ResolverError extends WhiskError {
  constructor(
    public readonly resolverName: string,
    message: string,
    cause?: unknown,
  ) {
    super({
      code: "RESOLVER_FAILED",
      message: `${resolverName} resolver failed: ${message}`,
      retryable: true,
      cause,
    });
    this.name = "ResolverError";
  }
}

export class BridgeStepError extends WhiskError {
  constructor(
    step: StepName,
    message: string,
    opts: { retryable?: boolean; cause?: unknown } = {},
  ) {
    super({
      code: "BRIDGE_STEP_FAILED",
      message: `Bridge step "${step}" failed: ${message}`,
      step,
      retryable: opts.retryable ?? true,
      cause: opts.cause,
    });
    this.name = "BridgeStepError";
  }
}

export class UserRejectedError extends WhiskError {
  constructor(message = "User rejected the request.", cause?: unknown) {
    super({
      code: "USER_REJECTED",
      message,
      retryable: true,
      category: "user_rejected",
      cause,
    });
    this.name = "UserRejectedError";
  }
}

export class NetworkError extends WhiskError {
  constructor(message: string, cause?: unknown, category?: WhiskErrorCategory) {
    super({
      code: "NETWORK_ERROR",
      message,
      retryable: true,
      category,
      cause,
    });
    this.name = "NetworkError";
  }
}

/**
 * Raised when the connected wallet can't honour a capability the SDK
 * needs — e.g. doesn't accept EIP-5792 `wallet_sendCalls`, enforces a
 * batch size cap, or fails to recognise a previously-issued batch id.
 *
 * Not retryable by reusing the same wallet; UI should prompt the user
 * to switch wallets or fall back to sequential signing.
 */
export class WalletCapabilityError extends WhiskError {
  constructor(
    category:
      | "atomic_unsupported"
      | "batch_too_large"
      | "duplicate_batch_id"
      | "unknown_bundle"
      | "polling_timeout",
    message: string,
    cause?: unknown,
  ) {
    super({
      code: "WALLET_CAPABILITY",
      message,
      retryable: false,
      category,
      cause,
    });
    this.name = "WalletCapabilityError";
  }
}

/**
 * Raised when a transaction made it on chain but reverted. Gas was
 * paid, no funds were moved. Surfaces in UI with the step name and
 * (when available) the on-chain revert reason.
 */
export class OnchainRevertError extends WhiskError {
  constructor(
    category: "reverted_onchain" | "partial_reverted" | "chain_revert",
    message: string,
    cause?: unknown,
    step?: StepName,
  ) {
    super({
      code: "ONCHAIN_REVERT",
      message,
      retryable: false,
      category,
      step,
      cause,
    });
    this.name = "OnchainRevertError";
  }
}

export class ConfigError extends WhiskError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "CONFIG_ERROR",
      message,
      retryable: false,
      cause,
    });
    this.name = "ConfigError";
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const TRANSIENT_PATTERNS =
  /ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|EAI_AGAIN|socket hang up|network error|fetch failed|status code 5\d{2}/i;

const REJECTION_PATTERNS = /user rejected|user denied|rejected by user/i;

/**
 * Coerce an unknown thrown value (axios/fetch/SDK error, plain string,
 * etc.) into a `WhiskError`. Used everywhere the engine catches in a
 * try/catch so callers always see a typed error.
 *
 * When a machine-readable `category` is available (App Kit 1.4.2+
 * surfaces it on `BridgeStep.errorCategory`), prefer it over the
 * heuristic string-match fallback below — category is authoritative,
 * regex patterns are best-effort.
 */
export function toWhiskError(
  err: unknown,
  fallbackMessage = "Unknown error",
  category?: WhiskErrorCategory,
): WhiskError {
  if (err instanceof WhiskError) return err;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallbackMessage;

  // Authoritative path: classify by App Kit's reported category.
  if (category) {
    switch (category) {
      case "user_rejected":
        return new UserRejectedError(message, err);
      case "failed_offchain":
        return new NetworkError(message, err, category);
      case "polling_timeout":
      case "atomic_unsupported":
      case "batch_too_large":
      case "duplicate_batch_id":
      case "unknown_bundle":
        return new WalletCapabilityError(category, message, err);
      case "reverted_onchain":
      case "partial_reverted":
      case "chain_revert":
        return new OnchainRevertError(category, message, err);
      case "unknown":
        // Fall through to heuristic matching below.
        break;
    }
  }

  // Heuristic fallback for plain Error / string throws without a
  // machine-readable category.
  if (REJECTION_PATTERNS.test(message)) {
    return new UserRejectedError(message, err);
  }
  if (TRANSIENT_PATTERNS.test(message)) {
    return new NetworkError(message, err);
  }
  return new WhiskError({
    code: "UNKNOWN",
    message,
    retryable: false,
    cause: err,
  });
}
