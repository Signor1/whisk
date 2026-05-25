import { createContext } from "react";
import type { WhiskEngine } from "@usewhisk/core";
import type { WhiskClientConfig } from "../config/types.js";

/**
 * Internal context for every Whisk component and hook. Read through
 * `useWhisk` / `useWhiskContext`, not directly. Constructed once per
 * provider mount and stable for the lifetime of that mount.
 */
export type WhiskContextValue = {
  engine: WhiskEngine;
  config: WhiskClientConfig;
  /** The theme prop passed to `<WhiskProvider>`. Used by portal scopes. */
  theme: "light" | "dark" | "system";
};

export const WhiskContext = createContext<WhiskContextValue | null>(null);
