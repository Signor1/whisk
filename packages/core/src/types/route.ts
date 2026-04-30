import type { Chain } from "./chain.js";

/**
 * Whisk decides at runtime whether a transfer is a same-chain `send` or a
 * cross-chain `bridge`. Devs don't pick — the widget routes based on the
 * source/destination chains the user chose.
 */
export type Route =
  | {
      kind: "send";
      chain: Chain;
    }
  | {
      kind: "bridge";
      sourceChain: Chain;
      destinationChain: Chain;
    };

export function isBridgeRoute(
  route: Route,
): route is Extract<Route, { kind: "bridge" }> {
  return route.kind === "bridge";
}

export function isSendRoute(
  route: Route,
): route is Extract<Route, { kind: "send" }> {
  return route.kind === "send";
}
