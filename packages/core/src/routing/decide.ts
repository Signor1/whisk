import type { Chain } from "../types/chain.js";
import type { Route } from "../types/route.js";
import { ConfigError } from "../errors/errors.js";

/**
 * Pick the right route for a transfer. Same chain → `send`, different
 * chains → `bridge`. The engine always calls this rather than hard-coding
 * the comparison so the rule lives in one place.
 *
 * Throws `ConfigError` if either chain is missing — this is a developer
 * mistake, not something the end user can fix.
 */
export function decideRoute(
  sourceChain: Chain,
  destinationChain: Chain,
): Route {
  if (!sourceChain || !destinationChain) {
    throw new ConfigError(
      "decideRoute: both sourceChain and destinationChain are required.",
    );
  }
  if (sourceChain === destinationChain) {
    return { kind: "send", chain: sourceChain };
  }
  return { kind: "bridge", sourceChain, destinationChain };
}
