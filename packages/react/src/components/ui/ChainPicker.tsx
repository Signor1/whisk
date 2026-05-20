"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { Chain } from "@signordev/whisk-core";
import { chainInfo } from "@signordev/whisk-core";
import { ChainIcon } from "./ChainIcon.js";

export type ChainPickerProps = {
  id?: string;
  label?: string;
  value: Chain;
  options: Chain[];
  onChange: (chain: Chain) => void;
  disabled?: boolean;
};

/**
 * Chain picker on Radix Select — consistent styling across browsers,
 * full keyboard navigation (arrow keys, type-to-select, escape), and
 * proper focus management out of the box.
 *
 * Each option (and the selected value in the trigger) ships with a
 * branded chain logo from `@web3icons/react`, so the dropdown reads
 * like every other production Web3 picker (Reown, RainbowKit, etc.).
 */
export function ChainPicker({
  id,
  label,
  value,
  options,
  onChange,
  disabled,
}: ChainPickerProps) {
  return (
    <label className="whisk-fieldbox" htmlFor={id}>
      {label ? <span className="whisk-fieldbox__label">{label}</span> : null}
      <Select.Root
        value={value}
        onValueChange={(v) => onChange(v as Chain)}
        disabled={disabled}
      >
        <Select.Trigger
          id={id}
          className="whisk-fieldbox__control whisk-select-trigger"
          aria-label={label ?? "Chain"}
        >
          {/* Branded logo for the currently selected chain. Sits to
              the left of the label so the trigger reads "icon → name".
              Trigger icon is 14px (vs 16px in the dropdown items below)
              so it doesn't crowd the label in the tight two-column
              source/destination layout. */}
          <ChainIcon
            chain={value}
            size={14}
            className="whisk-select-trigger__icon"
          />
          <Select.Value placeholder="Select a chain" />
          <Select.Icon asChild>
            <ChevronDown size={12} strokeWidth={2.5} style={{ opacity: 0.6 }} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          {/* Re-establish Whisk theme scope inside the portal. */}
          <div data-whisk="">
            <Select.Content
              className="whisk-select-content"
              position="popper"
              sideOffset={4}
              collisionPadding={8}
            >
              <Select.ScrollUpButton className="whisk-select-scroll">
                <ChevronUp size={14} strokeWidth={2.5} />
              </Select.ScrollUpButton>

              <Select.Viewport className="whisk-select-viewport">
                {options.map((c) => (
                  <Select.Item key={c} value={c} className="whisk-select-item">
                    <ChainIcon chain={c} className="whisk-select-item__icon" />
                    <Select.ItemText>{chainInfo(c).label}</Select.ItemText>
                    <Select.ItemIndicator className="whisk-select-item-indicator">
                      <Check size={14} strokeWidth={2.5} />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.Viewport>

              <Select.ScrollDownButton className="whisk-select-scroll">
                <ChevronDown size={14} strokeWidth={2.5} />
              </Select.ScrollDownButton>
            </Select.Content>
          </div>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}
