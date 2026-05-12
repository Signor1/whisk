"use client";

import type { Dispatch } from "react";
import { chainInfo, type Chain } from "@signordev/whisk-react";
import { PLAYGROUND_CHAINS } from "./providers";
import { PRESETS, type PresetId } from "./presets";
import { ADDRESS_BOOK } from "./address-book";
import type {
  PlaygroundAction,
  PlaygroundConfig,
  Theme,
} from "./store";

/**
 * The control panel that drives every adjustable prop on `<WhiskSend>`.
 * Grouped by surface so a tester can scan it during the QA sweep.
 *
 * Sections:
 *   1. Presets — five named shapes (Open form / Checkout / Donate /
 *      Invoice / Payroll). Picking one rewrites the entire form.
 *   2. Theme — system / light / dark
 *   3. Surface — wordmark + swap-tab toggles
 *   4. Amount — lock + value + nothing else
 *   5. Recipient — lock + value + address-book quick-picks
 *   6. Source / destination chain — lock + chain
 *   7. Config — JSON inspector for the live config object
 */

const HAS_KIT_KEY = Boolean(process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY);

export function Controls({
  config,
  dispatch,
}: {
  config: PlaygroundConfig;
  dispatch: Dispatch<PlaygroundAction>;
}) {
  const set = (patch: Partial<PlaygroundConfig>) =>
    dispatch({ type: "SET_CONFIG", patch });

  const applyPreset = (id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (preset) dispatch({ type: "APPLY_PRESET", config: preset.config });
  };

  return (
    <aside className="pg-controls" aria-label="Playground controls">
      <Section title="Presets">
        <div className="pg-presets">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="pg-preset"
              onClick={() => applyPreset(p.id)}
            >
              <span className="pg-preset__name">{p.name}</span>
              <span className="pg-preset__hint">{p.description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Theme">
        <ThemePicker
          value={config.theme}
          onChange={(theme) => set({ theme })}
        />
      </Section>

      <Section title="Surface">
        <Toggle
          label="Show wordmark"
          checked={config.showFooter}
          onChange={(showFooter) => set({ showFooter })}
        />
        <Toggle
          label="Swap tab"
          checked={config.swapEnabled}
          disabled={!HAS_KIT_KEY}
          hint={HAS_KIT_KEY ? undefined : "Set NEXT_PUBLIC_CIRCLE_KIT_KEY"}
          onChange={(swapEnabled) => set({ swapEnabled })}
        />
      </Section>

      <Section title="Amount">
        <Toggle
          label="Lock amount"
          checked={config.lockAmount}
          onChange={(lockAmount) => set({ lockAmount })}
        />
        <input
          className="pg-input pg-input--mono"
          type="text"
          inputMode="decimal"
          value={config.amount}
          onChange={(e) => set({ amount: e.target.value })}
          placeholder="0.00"
          aria-label="Amount"
        />
      </Section>

      <Section title="Recipient">
        <Toggle
          label="Lock recipient"
          checked={config.lockRecipient}
          onChange={(lockRecipient) => set({ lockRecipient })}
        />
        <input
          className="pg-input pg-input--mono"
          type="text"
          value={config.recipient}
          onChange={(e) => set({ recipient: e.target.value })}
          placeholder="vitalik.eth or 0x…"
          aria-label="Recipient"
        />
        <div className="pg-address-book">
          {ADDRESS_BOOK.map((entry) => (
            <button
              key={entry.value}
              type="button"
              className="pg-address-book__item"
              onClick={() => set({ recipient: entry.value })}
              title={entry.value}
            >
              <span className="pg-address-book__kind">{entry.kind}</span>
              {entry.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Source chain">
        <Toggle
          label="Lock source chain"
          checked={config.lockSourceChain}
          onChange={(lockSourceChain) => set({ lockSourceChain })}
        />
        <ChainSelect
          value={config.sourceChain}
          onChange={(sourceChain) => set({ sourceChain })}
        />
      </Section>

      <Section title="Destination chain">
        <Toggle
          label="Lock destination chain"
          checked={config.lockDestinationChain}
          onChange={(lockDestinationChain) =>
            set({ lockDestinationChain })
          }
        />
        <ChainSelect
          value={config.destinationChain}
          onChange={(destinationChain) => set({ destinationChain })}
        />
      </Section>

      <Section title="Inspector">
        <details className="pg-inspector">
          <summary>Live config (JSON)</summary>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </details>
        <p className="pg-faucets">
          Need testnet USDC?{" "}
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noreferrer"
          >
            Circle faucet ↗
          </a>
        </p>
      </Section>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pg-section">
      <h3 className="pg-section__title">{title}</h3>
      <div className="pg-section__body">{children}</div>
    </section>
  );
}

function ThemePicker({
  value,
  onChange,
}: {
  value: Theme;
  onChange: (t: Theme) => void;
}) {
  const options: Theme[] = ["system", "light", "dark"];
  return (
    <div role="radiogroup" className="pg-radio-group" aria-label="Theme">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          role="radio"
          aria-checked={value === opt}
          className="pg-radio"
          data-active={value === opt ? "true" : "false"}
          onClick={() => onChange(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <label className="pg-toggle" data-disabled={disabled ? "true" : "false"}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="pg-toggle__label">{label}</span>
      {hint ? <span className="pg-toggle__hint">{hint}</span> : null}
    </label>
  );
}

function ChainSelect({
  value,
  onChange,
}: {
  value: Chain;
  onChange: (chain: Chain) => void;
}) {
  return (
    <select
      className="pg-input"
      value={value}
      onChange={(e) => onChange(e.target.value as Chain)}
    >
      {PLAYGROUND_CHAINS.map((c) => (
        <option key={c} value={c}>
          {chainInfo(c).label}
        </option>
      ))}
    </select>
  );
}
