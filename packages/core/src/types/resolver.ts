import type { Chain } from "./chain.js";
import type { ResolvedRecipient } from "./recipient.js";

export type ResolverContext = {
  chain: Chain;
};

export type Resolver = {
  name: string;

  /** Cheap synchronous check. First-match wins; later resolvers never see the input. */
  matches: (input: string) => boolean;

  /** Return `null` for "tried and gave up". Throw `ResolverError` on unexpected failure. */
  resolve: (
    input: string,
    ctx: ResolverContext,
  ) => Promise<ResolvedRecipient | null>;
};
