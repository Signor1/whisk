"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { ReactNode } from "react";

export type BannerProps = {
  /** Visual tone. */
  variant?: "warning" | "info";
  children: ReactNode;
  /** Optional inline action button. */
  action?: { label: string; onClick: () => void; disabled?: boolean };
};

/**
 * Inline banner used for chain-mismatch warnings, low-gas warnings, and
 * any other non-blocking advisories the widget surfaces during the
 * compose flow.
 */
export function Banner({ variant = "info", children, action }: BannerProps) {
  const Icon = variant === "warning" ? AlertTriangle : Info;
  return (
    <div className={`whisk-banner whisk-banner--${variant}`}>
      <Icon size={13} strokeWidth={2} style={{ flex: "0 0 auto" }} />
      <span style={{ flex: 1 }}>{children}</span>
      {action ? (
        <button
          type="button"
          className="whisk-banner__action"
          onClick={action.onClick}
          disabled={action.disabled}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}
