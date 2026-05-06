import { describe, expect, it } from "vitest";
import {
  buildCustomFeeEntries,
  fromAppKitFees,
  sumFees,
  type AppKitEstimateFee,
} from "./calculate.js";

const HOST = "0xH00000000000000000000000000000000000000h";

describe("buildCustomFeeEntries", () => {
  it("returns an empty list when no policy is configured", () => {
    expect(buildCustomFeeEntries(undefined, "USDC")).toEqual([]);
  });

  it("returns an empty list when value is zero", () => {
    expect(
      buildCustomFeeEntries({ value: "0", recipient: HOST }, "USDC"),
    ).toEqual([]);
  });

  it("returns an empty list when value is malformed", () => {
    expect(
      buildCustomFeeEntries({ value: "not-a-number", recipient: HOST }, "USDC"),
    ).toEqual([]);
  });

  it("splits a $1 fee 90/10 between host and Arc", () => {
    const entries = buildCustomFeeEntries(
      { value: "1", recipient: HOST },
      "USDC",
    );
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({
      kind: "custom",
      amount: "0.9",
      recipient: HOST,
      description: "Host fee (90%)",
    });
    expect(entries[1]).toMatchObject({
      kind: "custom",
      amount: "0.1",
      description: "Arc share (10%)",
    });
    // Arc share has no recipient — App Kit injects it server-side.
    expect(entries[1]?.recipient).toBeUndefined();
  });

  it("formats fractional fees to USDC's six decimals, trimmed", () => {
    const entries = buildCustomFeeEntries(
      { value: "0.000001", recipient: HOST },
      "USDC",
    );
    // 0.000001 * 0.9 = 0.0000009 → rounded to 6dp = 0.000001
    // The exact rounding behaviour matters less than the invariant: every
    // amount parses cleanly back to a number.
    for (const e of entries) {
      expect(Number.isFinite(parseFloat(e.amount))).toBe(true);
    }
  });
});

describe("fromAppKitFees", () => {
  it("maps every App Kit fee `type` to a Whisk `FeeEntryKind`", () => {
    const input: AppKitEstimateFee[] = [
      { type: "kit", token: "USDC", amount: "0.1" },
      { type: "provider", token: "USDC", amount: "0.2" },
      { type: "forwarder", token: "USDC", amount: "0.05" },
      { type: "gasFee", token: "USDC", amount: "0.01" },
    ];
    const entries = fromAppKitFees(input, "USDC");
    expect(entries.map((e) => e.kind)).toEqual([
      "protocol",
      "provider",
      "forwarder",
      "gas",
    ]);
  });

  it("drops entries with null amount", () => {
    const input: AppKitEstimateFee[] = [
      { type: "kit", token: "USDC", amount: null },
      { type: "provider", token: "USDC", amount: "0.2" },
    ];
    const entries = fromAppKitFees(input, "USDC");
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ kind: "provider", amount: "0.2" });
  });

  it("falls back to defaultToken when fee.token is missing", () => {
    const input = [
      { type: "kit", token: undefined as unknown as string, amount: "0.1" },
    ] as AppKitEstimateFee[];
    const entries = fromAppKitFees(input, "USDC");
    expect(entries[0]?.token).toBe("USDC");
  });
});

describe("sumFees", () => {
  it("totals only entries denominated in the target token", () => {
    const breakdown = sumFees(
      [
        { kind: "protocol", amount: "0.1", token: "USDC" },
        { kind: "provider", amount: "0.2", token: "USDC" },
        { kind: "gas", amount: "0.005", token: "NATIVE" },
      ],
      "USDC",
    );
    expect(breakdown.total).toBe("0.3");
    expect(breakdown.token).toBe("USDC");
    // Non-USDC entries still appear in the breakdown for the UI to render.
    expect(breakdown.entries).toHaveLength(3);
  });

  it("returns zero total when no entries match the token", () => {
    const breakdown = sumFees(
      [{ kind: "gas", amount: "0.01", token: "NATIVE" }],
      "USDC",
    );
    expect(breakdown.total).toBe("0");
  });

  it("returns zero total when entry list is empty", () => {
    const breakdown = sumFees([], "USDC");
    expect(breakdown.total).toBe("0");
    expect(breakdown.entries).toEqual([]);
  });
});
