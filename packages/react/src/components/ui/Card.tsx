"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

/**
 * The widget shell. Padding lives in the CSS class so theme overrides
 * stay in one place; consumers can layer additional styles via
 * `className`.
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return <div ref={ref} className={cn("whisk-card", className)} {...props} />;
  },
);
