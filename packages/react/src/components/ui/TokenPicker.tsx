"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { Token } from "@strimz/whisk-core";

export type TokenPickerProps = {
  value: Token;
  options: ReadonlyArray<Token>;
  onChange: (token: Token) => void;
  disabled?: boolean;
  /** Help text rendered as a `title`/tooltip on the trigger. */
  hint?: string;
};

/**
 * Compact, button-style token picker. Looks like a pill — the active
 * token symbol with a chevron — and opens a Radix Select popover with
 * the full list. Used inside the amount + token row of both the
 * Transfer and Swap tabs so both flows feel uniform.
 *
 * The pill blends with `whisk-fieldbox` styling so it docks cleanly
 * next to the amount input without breaking the form rhythm.
 */
export function TokenPicker({
  value,
  options,
  onChange,
  disabled,
  hint,
}: TokenPickerProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => onChange(v as Token)}
      disabled={disabled}
    >
      <Select.Trigger
        className="whisk-token-picker"
        aria-label="Token"
        title={hint}
      >
        <Select.Value placeholder="Token" />
        <Select.Icon asChild>
          <ChevronDown size={12} strokeWidth={2.5} />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <div data-whisk="">
          <Select.Content
            className="whisk-select-content whisk-token-picker__menu"
            position="popper"
            sideOffset={4}
            collisionPadding={8}
          >
            <Select.Viewport className="whisk-select-viewport">
              {options.map((t) => (
                <Select.Item
                  key={t}
                  value={t}
                  className="whisk-select-item"
                >
                  <Select.ItemText>{t}</Select.ItemText>
                  <Select.ItemIndicator className="whisk-select-item-indicator">
                    <Check size={14} strokeWidth={2.5} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </div>
      </Select.Portal>
    </Select.Root>
  );
}
