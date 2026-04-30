import type { Chain } from "./chain.js";
import type { ResolvedRecipient } from "./recipient.js";

/**
 * Context handed to every resolver. Lets the resolver know what chain the
 * widget is currently targeting so e.g. an ENS resolver can return the
 * right destination chain (some recipients have different addresses per
 * chain, or only have a wallet on one chain).
 */
export type ResolverContext = {
  /** Chain the widget is currently targeting. */
  chain: Chain;
};

/**
 * The single extension point that lets host apps support email, phone,
 * handle, ENS, or any other recipient-identifier scheme without forking the
 * widget. Resolvers are pure async functions — Whisk holds no state across
 * calls.
 */
export type Resolver = {
  /** Stable identifier — used in telemetry and error messages. */
  name: string;

  /**
   * Cheap synchronous check that an input is the kind of thing this
   * resolver knows how to handle. The widget short-circuits to the first
   * matching resolver; later resolvers never see the input.
   */
  matches: (input: string) => boolean;

  /**
   * Resolve the input to an on-chain address. Return `null` if the input
   * matched but resolution failed (e.g. ENS name doesn't exist) — the
   * widget treats `null` as "tried and gave up". Throw a `ResolverError`
   * if something genuinely unexpected happened (network down, etc.).
   */
  resolve: (
    input: string,
    ctx: ResolverContext,
  ) => Promise<ResolvedRecipient | null>;
};
