"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn.js";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";
export type ButtonSize = "default" | "sm";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Whisk's button primitive. Maps to the `.whisk-button` rules in
 * `styles.css`; theme overrides flow through CSS variables.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "default", className, type, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={cn(
          "whisk-button",
          `whisk-button--${variant}`,
          size === "sm" && "whisk-button--sm",
          className,
        )}
        {...props}
      />
    );
  },
);
