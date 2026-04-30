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
  /** Misconfiguration — surfaced to the developer, not the end user. */
  | "CONFIG_ERROR"
  /** Catch-all for anything else. */
  | "UNKNOWN";

export interface WhiskErrorOptions {
  code: WhiskErrorCode;
  message: string;
  retryable?: boolean;
  step?: StepName;
  cause?: unknown;
}

export class WhiskError extends Error {
  readonly code: WhiskErrorCode;
  readonly retryable: boolean;
  readonly step?: StepName;
  override readonly cause?: unknown;

  constructor(opts: WhiskErrorOptions) {
    super(opts.message);
    this.name = "WhiskError";
    this.code = opts.code;
    this.retryable = opts.retryable ?? false;
    this.step = opts.step;
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
      cause,
    });
    this.name = "UserRejectedError";
  }
}

export class NetworkError extends WhiskError {
  constructor(message: string, cause?: unknown) {
    super({
      code: "NETWORK_ERROR",
      message,
      retryable: true,
      cause,
    });
    this.name = "NetworkError";
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
 */
export function toWhiskError(err: unknown, fallbackMessage = "Unknown error"): WhiskError {
  if (err instanceof WhiskError) return err;

  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : fallbackMessage;

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
