"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn.js";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "success" | "warning" | "error" | "muted";
  children?: ReactNode;
};

export function Badge({ variant = "muted", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn("whisk-badge", `whisk-badge--${variant}`, className)}
      {...props}
    />
  );
}
