"use client";

import { useEffect, useState, type Dispatch } from "react";
import { chainInfo, type Chain, type FeeBearer } from "@usewhisk/react";
import { PLAYGROUND_CHAINS } from "./providers";
import { ADDRESS_BOOK } from "./address-book";
import type {
  Palette,
  PlaygroundAction,
  PlaygroundConfig,
  Theme,
} from "./store";

/**
 * The control panel that drives every adjustable prop on `<WhiskSend>`.
 * Grouped by surface so a tester can scan it during the QA sweep.
 *
 * Sections:
 *   1. Theme — system / light / dark
 *   2. Palette — Wine / Indigo / Emerald / Amber
 *   3. Surface — swap-tab toggle
 *   4. Amount — lock + value
 *   5. Recipient — lock + value + address-book quick-picks
 *   6. Source / destination chain — lock + chain
 *   7. Config — JSON inspector for the live config object
 *
 * For preset shapes (checkout, donate, invoice, payroll, themed SaaS)
 * see the dedicated recipe apps under `examples/`.
 */

export function Controls({
  config,
  dispatch,
}: {
  config: PlaygroundConfig;
  dispatch: Dispatch<PlaygroundAction>;
}) {
  const set = (patch: Partial<PlaygroundConfig>) =>
    dispatch({ type: "SET_CONFIG", patch });

  const hasKitKey = useHasKitKey();

  return (
    <aside className="pg-controls" aria-label="Playground controls">
      <Section title="Theme">
        <ThemePicker
          value={config.theme}
          onChange={(theme) => set({ theme })}
        />
      </Section>

      <Section title="Palette">
        <PalettePicker
          value={config.palette}
          onChange={(palette) => set({ palette })}
        />
      </Section>

      <Section title="Fee bearer">
        <FeeBearerPicker
          value={config.feeBearer}
          onChange={(feeBearer) => set({ feeBearer })}
        />
        <span className="pg-toggle__hint">
          {config.feeBearer === "sender"
            ? "Burn is grossed up so the recipient nets the full amount. Switching reconnects the widget."
            : "Fees come out of the transfer; recipient nets amount − fees. Switching reconnects the widget."}
        </span>
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
          disabled={!hasKitKey}
          hint={hasKitKey ? undefined : "Set CIRCLE_KIT_KEY on the server"}
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
          onChange={(lockDestinationChain) => set({ lockDestinationChain })}
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
          <a href="https://faucet.circle.com" target="_blank" rel="noreferrer">
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

function FeeBearerPicker({
  value,
  onChange,
}: {
  value: FeeBearer;
  onChange: (f: FeeBearer) => void;
}) {
  const options: FeeBearer[] = ["receiver", "sender"];
  return (
    <div role="radiogroup" className="pg-radio-group" aria-label="Fee bearer">
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

const PALETTE_SWATCHES: Array<{ id: Palette; label: string; color: string }> = [
  { id: "wine", label: "Wine", color: "#d65c3c" },
  { id: "indigo", label: "Indigo", color: "#6366f1" },
  { id: "emerald", label: "Emerald", color: "#10b981" },
  { id: "amber", label: "Amber", color: "#f59e0b" },
];

function PalettePicker({
  value,
  onChange,
}: {
  value: Palette;
  onChange: (p: Palette) => void;
}) {
  return (
    <div role="radiogroup" className="pg-palette-row" aria-label="Palette">
      {PALETTE_SWATCHES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={value === p.id}
          aria-label={p.label}
          title={p.label}
          className="pg-palette-swatch"
          data-active={value === p.id ? "true" : "false"}
          style={{ background: p.color }}
          onClick={() => onChange(p.id)}
        />
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

/**
 * Resolves the swap-tab availability flag by hitting the `/api/kit-key`
 * route once on mount. The route reads `CIRCLE_KIT_KEY` from server-only
 * env and returns just a boolean — the key itself isn't sent to the
 * client until the widget actually needs it.
 */
function useHasKitKey(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/kit-key")
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((data) => {
        if (!cancelled) setHas(Boolean(data?.available));
      })
      .catch(() => {
        /* Treat any error as "no swap support." */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return has;
}
