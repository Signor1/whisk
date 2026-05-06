import { describe, expect, it } from "vitest";
import {
  allChains,
  chainByEvmId,
  chainInfo,
  chainsByKind,
  chainsByNetwork,
  explorerAddressUrl,
  explorerTxUrl,
} from "./registry.js";

describe("chain registry", () => {
  it("chainInfo returns metadata for a known chain", () => {
    const info = chainInfo("Arc_Testnet");
    expect(info.label).toBeTruthy();
    expect(info.kind).toBe("evm");
    expect(info.network).toBe("testnet");
    expect(info.evmChainId).toBeTypeOf("number");
  });

  it("chainInfo throws on unknown chains", () => {
    expect(() => chainInfo("nope" as never)).toThrow();
  });

  it("allChains() exposes a non-empty registry", () => {
    expect(allChains().length).toBeGreaterThan(0);
  });

  it("partitions cleanly by network", () => {
    const mainnets = chainsByNetwork("mainnet");
    const testnets = chainsByNetwork("testnet");
    expect(mainnets.every((c) => c.network === "mainnet")).toBe(true);
    expect(testnets.every((c) => c.network === "testnet")).toBe(true);
    expect(mainnets.length + testnets.length).toBe(allChains().length);
  });

  it("partitions cleanly by kind", () => {
    const evm = chainsByKind("evm");
    const solana = chainsByKind("solana");
    expect(evm.every((c) => c.kind === "evm")).toBe(true);
    expect(solana.every((c) => c.kind === "solana")).toBe(true);
  });

  it("every EVM chain has an evmChainId", () => {
    for (const c of chainsByKind("evm")) {
      expect(c.evmChainId, `chain ${c.chain} missing evmChainId`).toBeTypeOf(
        "number",
      );
    }
  });

  it("Solana chains have no evmChainId", () => {
    for (const c of chainsByKind("solana")) {
      expect(c.evmChainId).toBeUndefined();
    }
  });

  it("evmChainId values are unique across the registry", () => {
    const ids = chainsByKind("evm").map((c) => c.evmChainId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("chainByEvmId round-trips with chainInfo", () => {
    const arc = chainInfo("Arc_Testnet");
    if (!arc.evmChainId) throw new Error("setup");
    const back = chainByEvmId(arc.evmChainId);
    expect(back?.chain).toBe(arc.chain);
  });

  it("chainByEvmId returns undefined for unknown IDs", () => {
    expect(chainByEvmId(999_999_999)).toBeUndefined();
    expect(chainByEvmId(undefined)).toBeUndefined();
  });

  it("explorerTxUrl produces a usable URL", () => {
    const url = explorerTxUrl("Arc_Testnet", "0xabc");
    expect(url).toContain("0xabc");
    expect(url).toMatch(/^https?:\/\//);
  });

  it("explorerAddressUrl produces a usable URL", () => {
    const url = explorerAddressUrl("Arc_Testnet", "0xdef");
    expect(url).toContain("0xdef");
    expect(url).toMatch(/^https?:\/\//);
  });

  it("Solana explorer URLs include the cluster query string", () => {
    const url = explorerTxUrl("Solana_Devnet", "sig123");
    expect(url).toMatch(/cluster=devnet/);
  });
});
