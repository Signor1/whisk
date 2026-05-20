import type { Chain } from "./chain.js";

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
