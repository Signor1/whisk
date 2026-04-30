"use client";

import { useContext } from "react";
import { WhiskContext, type WhiskContextValue } from "../provider/context.js";

/**
 * Read the active Whisk context. Throws when used outside of a
 * `<WhiskProvider>` so misconfiguration surfaces during development
 * rather than producing nullable values everywhere downstream.
 */
export function useWhiskContext(): WhiskContextValue {
  const ctx = useContext(WhiskContext);
  if (!ctx) {
    throw new Error(
      "[whisk] useWhiskContext: component must be wrapped in <WhiskProvider>.",
    );
  }
  return ctx;
}
