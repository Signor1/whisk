import type { Chain } from "./chain.js";

/**
 * A recipient that has been resolved to a concrete address on a specific
 * chain. The widget will not begin a quote/send until it has one of these.
 *
 * Resolvers (address parser, ENS, email, etc.) all return this shape so the
 * widget treats them uniformly.
 */
export type ResolvedRecipient = {
  /** On-chain address. EVM hex or Solana base58. */
  address: string;
  /** Chain the address is valid on. */
  chain: Chain;
  /**
   * Human-readable label to show next to the address — e.g. `alice.eth`,
   * `+254712345678`, or a display name from a custom resolver.
   */
  displayName?: string;
  /**
   * Set by resolvers that mint a fresh wallet for an off-platform recipient
   * (e.g. an email-based remittance flow). The host app is responsible for
   * delivering the claim link out-of-band.
   */
  needsClaimLink?: boolean;
  /** Opaque token the host app uses to look up / activate the claim. */
  claimToken?: string;
};
