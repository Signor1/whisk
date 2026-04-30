import type { Resolver, ResolverContext } from "../types/resolver.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import { ResolverError, toWhiskError } from "../errors/errors.js";

/**
 * Combine multiple resolvers into a single one. The returned resolver runs
 * each child in order and returns the first non-null match.
 *
 * - If a child throws, the error surfaces as a `ResolverError` with the
 *   child's `name` so devs can see which resolver actually broke.
 * - If a child's `matches` returns false the child is skipped silently.
 * - If all children's `matches` return false, the composite's `matches`
 *   returns false too — useful in UIs that distinguish "didn't match
 *   anything" from "matched but failed to resolve".
 */
export function composeResolvers(
  resolvers: ReadonlyArray<Resolver>,
  options: { name?: string } = {},
): Resolver {
  if (resolvers.length === 0) {
    throw new Error("composeResolvers: at least one resolver is required.");
  }

  return {
    name: options.name ?? "composite",
    matches: (input) => resolvers.some((r) => r.matches(input)),
    resolve: async (
      input,
      ctx: ResolverContext,
    ): Promise<ResolvedRecipient | null> => {
      for (const resolver of resolvers) {
        if (!resolver.matches(input)) continue;
        try {
          const result = await resolver.resolve(input, ctx);
          if (result) return result;
        } catch (err) {
          // Re-throw as ResolverError so the engine knows which resolver
          // failed. Preserves the original cause for debugging.
          if (err instanceof ResolverError) throw err;
          const wrapped = toWhiskError(err, "Resolver threw an error");
          throw new ResolverError(resolver.name, wrapped.message, err);
        }
      }
      return null;
    },
  };
}
