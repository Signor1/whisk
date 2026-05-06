import { describe, expect, it } from "vitest";
import {
  WhiskError,
  NoAdapterError,
  NetworkError,
  UserRejectedError,
  toWhiskError,
} from "./errors.js";

describe("toWhiskError", () => {
  it("returns a WhiskError unchanged", () => {
    const original = new NoAdapterError();
    expect(toWhiskError(original)).toBe(original);
  });

  it("classifies user rejections from the message", () => {
    const result = toWhiskError(new Error("User rejected the request"));
    expect(result).toBeInstanceOf(UserRejectedError);
    expect(result.code).toBe("USER_REJECTED");
    expect(result.retryable).toBe(true);
  });

  it("classifies user denials too (MetaMask wording)", () => {
    const result = toWhiskError(new Error("MetaMask Tx Signature: User denied transaction signature."));
    expect(result.code).toBe("USER_REJECTED");
  });

  it("classifies transient network failures", () => {
    for (const msg of [
      "ECONNRESET",
      "ETIMEDOUT",
      "fetch failed",
      "socket hang up",
      "Request returned status code 502",
    ]) {
      const result = toWhiskError(new Error(msg));
      expect(result).toBeInstanceOf(NetworkError);
      expect(result.retryable).toBe(true);
    }
  });

  it("falls back to UNKNOWN for unrecognised errors", () => {
    const result = toWhiskError(new Error("something exploded"));
    expect(result.code).toBe("UNKNOWN");
    expect(result.retryable).toBe(false);
    expect(result).toBeInstanceOf(WhiskError);
  });

  it("accepts a plain string", () => {
    const result = toWhiskError("nope");
    expect(result.message).toBe("nope");
    expect(result.code).toBe("UNKNOWN");
  });

  it("uses the fallback message when the error is unhelpful", () => {
    const result = toWhiskError(undefined, "default message");
    expect(result.message).toBe("default message");
  });

  it("preserves the original cause for debugging", () => {
    const inner = new Error("root cause");
    const wrapped = toWhiskError(inner);
    expect(wrapped.cause).toBe(inner);
  });

  it("survives `instanceof` after structured throw/catch", () => {
    try {
      throw new NoAdapterError();
    } catch (err) {
      expect(err).toBeInstanceOf(NoAdapterError);
      expect(err).toBeInstanceOf(WhiskError);
    }
  });
});
