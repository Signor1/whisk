"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** Render in mono font — used for hex addresses, txHashes, etc. */
  mono?: boolean;
  /** Apply the invalid border + colour state. */
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { mono, invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "whisk-input",
        mono && "whisk-input--mono",
        invalid && "whisk-input--invalid",
        className,
      )}
      {...props}
    />
  );
});
