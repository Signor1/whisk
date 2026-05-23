import type { Resolver, ResolverContext } from "../types/resolver.js";
import type { ResolvedRecipient } from "../types/recipient.js";
import { ResolverError, toWhiskError } from "../errors/errors.js";

/** Run resolvers in order, returning the first non-null match. Errors wrap as `ResolverError`. */
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
          if (err instanceof ResolverError) throw err;
          const wrapped = toWhiskError(err, "Resolver threw an error");
          throw new ResolverError(resolver.name, wrapped.message, err);
        }
      }
      return null;
    },
  };
}
