"use client";

import type { ReactNode } from "react";

export type HeaderProps = {
  /**
   * Eyebrow tag rendered on the right of the wordmark. Use it for
   * contextual labels like the current step, "TESTNET", or a transfer
   * status. Falls back to nothing.
   */
  tag?: ReactNode;
};

/**
 * Card header — wordmark on the left, optional eyebrow tag on the
 * right. The wordmark is intentionally simple text in the brand font;
 * inline-SVG logomark support comes later.
 */
export function Header({ tag }: HeaderProps) {
  return (
    <div className="whisk-header">
      <span className="whisk-header__mark">whisk</span>
      {tag ? <span className="whisk-header__tag">{tag}</span> : null}
    </div>
  );
}
