import { describe, expect, it } from "vitest";
import { composeResolvers } from "./compose.js";
import { ResolverError } from "../errors/errors.js";
import type { Resolver } from "../types/resolver.js";
import type { ResolvedRecipient } from "../types/recipient.js";

const RECIPIENT_A: ResolvedRecipient = {
  address: "0xA000000000000000000000000000000000000000",
  chain: "Arc_Testnet",
};

const RECIPIENT_B: ResolvedRecipient = {
  address: "0xB000000000000000000000000000000000000000",
  chain: "Arc_Testnet",
};

const ctx = { chain: "Arc_Testnet" } as const;

function makeResolver(opts: {
  name: string;
  matches: (input: string) => boolean;
  resolve: () => Promise<ResolvedRecipient | null>;
}): Resolver {
  return opts;
}

describe("composeResolvers", () => {
  it("throws when no resolvers are passed", () => {
    expect(() => composeResolvers([])).toThrow(/at least one resolver/i);
  });

  it("returns the first resolver's match", async () => {
    const r = composeResolvers([
      makeResolver({
        name: "first",
        matches: () => true,
        resolve: async () => RECIPIENT_A,
      }),
      makeResolver({
        name: "second",
        matches: () => true,
        resolve: async () => RECIPIENT_B,
      }),
    ]);
    const result = await r.resolve("anything", ctx);
    expect(result).toBe(RECIPIENT_A);
  });

  it("falls through to the next resolver when one returns null", async () => {
    const r = composeResolvers([
      makeResolver({
        name: "first",
        matches: () => true,
        resolve: async () => null,
      }),
      makeResolver({
        name: "second",
        matches: () => true,
        resolve: async () => RECIPIENT_B,
      }),
    ]);
    const result = await r.resolve("a", ctx);
    expect(result).toBe(RECIPIENT_B);
  });

  it("skips resolvers that don't match", async () => {
    let called = false;
    const r = composeResolvers([
      makeResolver({
        name: "non-matching",
        matches: () => false,
        resolve: async () => {
          called = true;
          return RECIPIENT_A;
        },
      }),
      makeResolver({
        name: "matching",
        matches: () => true,
        resolve: async () => RECIPIENT_B,
      }),
    ]);
    const result = await r.resolve("a", ctx);
    expect(called).toBe(false);
    expect(result).toBe(RECIPIENT_B);
  });

  it("returns null when no child matches", async () => {
    const r = composeResolvers([
      makeResolver({
        name: "never",
        matches: () => false,
        resolve: async () => RECIPIENT_A,
      }),
    ]);
    expect(await r.resolve("a", ctx)).toBeNull();
  });

  it("composite `matches` is true when any child matches", () => {
    const r = composeResolvers([
      makeResolver({
        name: "no",
        matches: () => false,
        resolve: async () => null,
      }),
      makeResolver({
        name: "yes",
        matches: (input) => input === "yes",
        resolve: async () => RECIPIENT_A,
      }),
    ]);
    expect(r.matches("yes")).toBe(true);
    expect(r.matches("no-match")).toBe(false);
  });

  it("rethrows ResolverError unchanged", async () => {
    const original = new ResolverError("inner", "kaboom");
    const r = composeResolvers([
      makeResolver({
        name: "throws",
        matches: () => true,
        resolve: async () => {
          throw original;
        },
      }),
    ]);
    await expect(r.resolve("a", ctx)).rejects.toBe(original);
  });

  it("wraps non-WhiskError throws as ResolverError tagged with the resolver name", async () => {
    const r = composeResolvers([
      makeResolver({
        name: "bad-resolver",
        matches: () => true,
        resolve: async () => {
          throw new Error("network died");
        },
      }),
    ]);
    await expect(r.resolve("a", ctx)).rejects.toMatchObject({
      name: "ResolverError",
      resolverName: "bad-resolver",
    });
  });

  it("uses the provided composite name", () => {
    const r = composeResolvers(
      [
        makeResolver({
          name: "x",
          matches: () => false,
          resolve: async () => null,
        }),
      ],
      { name: "default-chain" },
    );
    expect(r.name).toBe("default-chain");
  });
});
