import type { Chain } from "../types/chain.js";
import type { Route } from "../types/route.js";
import { ConfigError } from "../errors/errors.js";

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
