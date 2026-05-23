import { createContext } from "react";
import type { WhiskEngine } from "@usewhisk/core";
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
  /** The theme prop passed to `<WhiskProvider>`. Used by portal scopes. */
  theme: "light" | "dark" | "system";
};

export const WhiskContext = createContext<WhiskContextValue | null>(null);
