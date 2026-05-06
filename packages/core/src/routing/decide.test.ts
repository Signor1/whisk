import { describe, expect, it } from "vitest";
import { decideRoute } from "./decide.js";
import { ConfigError } from "../errors/errors.js";

describe("decideRoute", () => {
  it("returns a `send` route when source and destination match", () => {
    expect(decideRoute("Arc_Testnet", "Arc_Testnet")).toEqual({
      kind: "send",
      chain: "Arc_Testnet",
    });
  });

  it("returns a `bridge` route when source and destination differ", () => {
    expect(decideRoute("Arc_Testnet", "Base_Sepolia")).toEqual({
      kind: "bridge",
      sourceChain: "Arc_Testnet",
      destinationChain: "Base_Sepolia",
    });
  });

  it("treats EVM ↔ Solana as a bridge", () => {
    expect(decideRoute("Arc_Testnet", "Solana_Devnet")).toMatchObject({
      kind: "bridge",
    });
  });

  it("throws ConfigError when sourceChain is missing", () => {
    expect(() => decideRoute(undefined as never, "Arc_Testnet")).toThrow(
      ConfigError,
    );
  });

  it("throws ConfigError when destinationChain is missing", () => {
    expect(() => decideRoute("Arc_Testnet", undefined as never)).toThrow(
      ConfigError,
    );
  });
});
