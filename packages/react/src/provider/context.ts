import { createContext } from "react";
import type { WhiskEngine } from "@signordev/whisk-core";
import type { WhiskClientConfig } from "../config/types.js";

/**
 * Internal context shared by every Whisk component and hook. Components
 * never read directly from this context — they go through hooks (`useWhisk`,
 * `useWhiskEngine`, etc.) that provide stable, narrowed signatures.
 *
 * The context value is constructed once by `<WhiskProvider>` per mount and
 * is stable for the lifetime of the provider.
 */
export type WhiskContextValue = {
  engine: WhiskEngine;
  config: WhiskClientConfig;
};

export const WhiskContext = createContext<WhiskContextValue | null>(null);
