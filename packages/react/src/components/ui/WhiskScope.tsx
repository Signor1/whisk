"use client";

import type { ReactNode } from "react";
import { useWhiskContext } from "../../hooks/useWhiskContext.js";

/**
 * Re-establishes Whisk's CSS scope inside a Radix Portal.
 *
 * Radix portals render at `document.body`, outside the WhiskProvider's
 * wrapper. Without re-applying `data-whisk` and the active theme
 * attribute, portal content (modals, dropdowns) misses the variables —
 * fine for `theme="system"` (the OS media query still fires) but
 * broken for explicit `theme="light"` / `theme="dark"`.
 *
 * Wrap every portal's content in `<WhiskScope>` to mirror what
 * WhiskProvider does for the in-tree subtree.
 */
export function WhiskScope({ children }: { children: ReactNode }) {
  const { theme } = useWhiskContext();
  const themeAttr = theme === "system" ? undefined : theme;
  return (
    <div
      data-whisk=""
      data-whisk-theme={themeAttr}
      className={theme === "dark" ? "dark" : undefined}
    >
      {children}
    </div>
  );
}
