"use client";

import { useContext } from "react";
import { WhiskContext, type WhiskContextValue } from "../provider/context.js";

export function useWhiskContext(): WhiskContextValue {
  const ctx = useContext(WhiskContext);
  if (!ctx) {
    throw new Error(
      "[whisk] useWhiskContext: component must be wrapped in <WhiskProvider>.",
    );
  }
  return ctx;
}
