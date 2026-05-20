import type { Chain } from "./chain.js";

export type ResolvedRecipient = {
  address: string;
  chain: Chain;
  displayName?: string;
  /** Set by resolvers that mint a fresh wallet for an off-platform recipient. */
  needsClaimLink?: boolean;
  claimToken?: string;
};
