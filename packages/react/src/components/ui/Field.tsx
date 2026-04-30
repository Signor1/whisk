"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/cn.js";

export type FieldProps = {
  /** Renders as the form label, associated via `htmlFor`. */
  label?: ReactNode;
  /** Bound to the input's `id`. */
  htmlFor?: string;
  /** Help text shown under the input. */
  help?: ReactNode;
  /** Error text shown under the input — supersedes `help`. */
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Composes a label + control + help/error message into a single block.
 * Components keep a stable layout regardless of whether help or error
 * text is present.
 */
export function Field({
  label,
  htmlFor,
  help,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn(className)}>
      {label ? (
        <label htmlFor={htmlFor} className="whisk-label">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <div className="whisk-help whisk-help--error">{error}</div>
      ) : help ? (
        <div className="whisk-help">{help}</div>
      ) : null}
    </div>
  );
}
