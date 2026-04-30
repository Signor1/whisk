"use client";

import type { Chain } from "@strimz/whisk-core";
import { chainInfo } from "@strimz/whisk-core";
import { Field } from "./Field.js";

export type ChainPickerProps = {
  id?: string;
  label?: string;
  value: Chain;
  options: Chain[];
  onChange: (chain: Chain) => void;
  disabled?: boolean;
};

/**
 * Native `<select>` chain picker. We render the registry's `label` rather
 * than the raw chain code so users see "Arc Testnet" instead of
 * "Arc_Testnet". Native is intentional — it gets every browser's a11y
 * affordances (mobile sheet on iOS, search on desktop) for free, and it
 * keeps the bundle tiny.
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
    <Field label={label} htmlFor={id}>
      <select
        id={id}
        className="whisk-input"
        value={value}
        onChange={(e) => onChange(e.target.value as Chain)}
        disabled={disabled}
      >
        {options.map((c) => (
          <option key={c} value={c}>
            {chainInfo(c).label}
          </option>
        ))}
      </select>
    </Field>
  );
}
