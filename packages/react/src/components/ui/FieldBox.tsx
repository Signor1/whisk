"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "../../lib/cn.js";

type CommonProps = {
  label: ReactNode;
  /** Right-aligned suffix shown next to the value (e.g. `USDC`). */
  suffix?: ReactNode;
  /** Render the value at amount-input scale (1.375rem). */
  amount?: boolean;
  /** Render the value in monospace (addresses, hashes). */
  mono?: boolean;
  /** Apply the invalid border + colour state. */
  invalid?: boolean;
  className?: string;
};

export type FieldBoxProps = CommonProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

/**
 * Stripe-style inset-label field for `<input>`. The label sits inside
 * the bordered box above the value. Replaces the older "label above +
 * input below" Field pattern in higher-density widget surfaces (amount,
 * recipient).
 *
 * The wrapping `<label>` makes the whole box click-target the inner
 * control — the affordance users expect.
 */
export const FieldBox = forwardRef<HTMLInputElement, FieldBoxProps>(
  function FieldBox(
    { label, suffix, amount, mono, invalid, className, ...rest },
    ref,
  ) {
    return (
      <label
        className={cn(
          "whisk-fieldbox",
          amount && "whisk-fieldbox--amount",
          mono && "whisk-fieldbox--mono",
          invalid && "whisk-fieldbox--invalid",
          className,
        )}
      >
        <span className="whisk-fieldbox__label">{label}</span>
        <span className="whisk-fieldbox__control">
          <input ref={ref} {...rest} />
          {suffix ? (
            <span className="whisk-fieldbox__suffix">{suffix}</span>
          ) : null}
        </span>
      </label>
    );
  },
);

export type FieldBoxSelectProps = CommonProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    children?: ReactNode;
  };

/**
 * Inset-label `<select>` companion to `FieldBox`. Same visual structure
 * — label inside the box, native picker below — used for chain pickers.
 */
export const FieldBoxSelect = forwardRef<
  HTMLSelectElement,
  FieldBoxSelectProps
>(function FieldBoxSelect(
  { label, suffix, mono, invalid, className, children, ...rest },
  ref,
) {
  return (
    <label
      className={cn(
        "whisk-fieldbox",
        mono && "whisk-fieldbox--mono",
        invalid && "whisk-fieldbox--invalid",
        className,
      )}
    >
      <span className="whisk-fieldbox__label">{label}</span>
      <span className="whisk-fieldbox__control">
        <select ref={ref} {...rest}>
          {children}
        </select>
        {suffix ? (
          <span className="whisk-fieldbox__suffix">{suffix}</span>
        ) : null}
      </span>
    </label>
  );
});
