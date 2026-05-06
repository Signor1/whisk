import { describe, expect, it } from "vitest";
import { addressResolver } from "./address.js";

const EVM_ADDR = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1";
const SOL_ADDR = "5xot9PVkphiX2adznghwrAuxGs2zeWisNSxMW6hU2Hxw";

describe("addressResolver — matches()", () => {
  it("matches EVM hex addresses", () => {
    expect(addressResolver.matches(EVM_ADDR)).toBe(true);
  });

  it("matches Solana base58 addresses", () => {
    expect(addressResolver.matches(SOL_ADDR)).toBe(true);
  });

  it("trims whitespace before matching", () => {
    expect(addressResolver.matches(`  ${EVM_ADDR}  `)).toBe(true);
  });

  it("rejects ENS-style names", () => {
    expect(addressResolver.matches("alice.eth")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(addressResolver.matches("")).toBe(false);
  });
});

describe("addressResolver — resolve()", () => {
  it("returns the EVM address on an EVM chain", async () => {
    const result = await addressResolver.resolve(EVM_ADDR, {
      chain: "Arc_Testnet",
    });
    expect(result).toEqual({ address: EVM_ADDR, chain: "Arc_Testnet" });
  });

  it("returns the Solana address on a Solana chain", async () => {
    const result = await addressResolver.resolve(SOL_ADDR, {
      chain: "Solana_Devnet",
    });
    expect(result).toEqual({ address: SOL_ADDR, chain: "Solana_Devnet" });
  });

  it("returns null when an EVM address is sent to a Solana chain", async () => {
    const result = await addressResolver.resolve(EVM_ADDR, {
      chain: "Solana_Devnet",
    });
    expect(result).toBeNull();
  });

  it("returns null when a Solana address is sent to an EVM chain", async () => {
    const result = await addressResolver.resolve(SOL_ADDR, {
      chain: "Arc_Testnet",
    });
    expect(result).toBeNull();
  });
});
