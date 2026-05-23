import type {
  ComponentType,
  CSSProperties,
  ReactNode,
  SVGAttributes,
} from "react";
import { ArrowRight, ChevronDown, Lock } from "lucide-react";
import {
  NetworkArbitrumOne,
  NetworkArc,
  NetworkAvalanche,
  NetworkBase,
  NetworkMonad,
  NetworkOptimism,
  NetworkPolygon,
  NetworkSolana,
  TokenUSDC,
  TokenEURC,
  TokenUSDT,
  TokenDAI,
  TokenPYUSD,
  TokenUSDE,
} from "@web3icons/react";

/**
 * Non-interactive visual mock of `<WhiskSend />`. Mirrors the real
 * widget shape from `packages/react/src/components/WhiskSend.tsx` and
 * `InputStep.tsx`:
 *
 *   ┌─ whisk-card (26rem) ──────────────────────────┐
 *   │  [Testnet]              [Base] [0x12…ab ▾]    │  ← top row (when connected)
 *   │  ┌─ From ──────┐ ┌─ To ──────────┐            │
 *   │  │ ● Base      │ │ ● Base        │            │
 *   │  └─────────────┘ └───────────────┘            │
 *   │  ┌─ Recipient (🔒 if locked) ──────────────┐  │
 *   │  ┌─ Amount (🔒 if locked) ──────┐ [USDC ▾] │  │
 *   │  You have $48.20 USDC · MAX                   │
 *   │  [          Review →          ]               │
 *   └───────────────────────────────────────────────┘
 *
 * **Controlled props match the real widget.** A field is rendered
 * locked precisely when its prop is supplied:
 *
 * | Real prop          | Mock prop          | Lock signal             |
 * | ------------------ | ------------------ | ----------------------- |
 * | `recipient`        | `recipient`        | label gets a 🔒 prefix  |
 * | `amount`           | `amount`           | label gets a 🔒 prefix  |
 * | `sourceChain`      | `sourceChain`      | "From (locked)" label   |
 * | `destinationChain` | `destinationChain` | "To (locked)" label     |
 *
 * Theming: pass any of the CSS variables in `theme`. They get applied
 * inline on a `data-whisk` wrapper, exactly like a real host site
 * would override `[data-whisk] { --whisk-* }` in its own stylesheet.
 */

type Web3Icon = ComponentType<
  SVGAttributes<SVGSVGElement> & {
    variant?: "branded" | "mono" | "background";
    size?: number | string;
  }
>;

const CHAIN_ICONS: Record<string, Web3Icon> = {
  Base: NetworkBase,
  Optimism: NetworkOptimism,
  Arbitrum: NetworkArbitrumOne,
  Polygon: NetworkPolygon,
  Arc: NetworkArc,
  Solana: NetworkSolana,
  Avalanche: NetworkAvalanche,
  Monad: NetworkMonad,
};

const TOKEN_ICONS: Record<string, Web3Icon> = {
  USDC: TokenUSDC,
  EURC: TokenEURC,
  USDT: TokenUSDT,
  DAI: TokenDAI,
  PYUSD: TokenPYUSD,
  USDe: TokenUSDE,
};

export type WidgetTheme = {
  bg?: string;
  card?: string;
  fg?: string;
  fgMuted?: string;
  border?: string;
  primary?: string;
  primaryFg?: string;
  fieldBg?: string;
  radius?: string;
};

export type WidgetMockProps = {
  /** Host-site colour overrides applied as `--whisk-*` CSS variables. */
  theme: WidgetTheme;

  /* ───── Controlled props (match the real `<WhiskSend>`) ───── */

  /** Set → recipient row renders as locked. */
  recipient?: string;
  /** Set when not locked → seeded value visible in the field. */
  defaultRecipient?: string;

  /** Set → amount row renders as locked. */
  amount?: string;
  /** Set when not locked → seeded value visible in the field. */
  defaultAmount?: string;

  /** Set → "From" picker renders as locked. */
  sourceChain?: keyof typeof CHAIN_ICONS;
  /** Set → "To" picker renders as locked. */
  destinationChain?: keyof typeof CHAIN_ICONS;
  /** Visual default when not locked. */
  initialSourceChain?: keyof typeof CHAIN_ICONS;
  initialDestinationChain?: keyof typeof CHAIN_ICONS;

  /** Token symbol shown in the suffix picker. */
  token?: string;

  /** Connected wallet state — drives the top-row chip + network pill. */
  connectedAddress?: string;
  connectedChain?: keyof typeof CHAIN_ICONS;

  /** Override the primary CTA label. Defaults to "Review →". */
  cta?: string;

  /** Wallet balance shown in the BalanceLine. Pass per-recipe so it
   * always reads as more than `amount` — real users see they can cover
   * the payment before signing. */
  balance?: string;

  className?: string;
};

export function WidgetMock({
  theme,
  recipient,
  defaultRecipient,
  amount,
  defaultAmount,
  sourceChain,
  destinationChain,
  initialSourceChain = "Base",
  initialDestinationChain = "Base",
  token = "USDC",
  connectedAddress = "0x42a8…7c91",
  connectedChain,
  cta = "Review",
  balance = "120.00",
  className,
}: WidgetMockProps) {
  const isRecipientLocked = recipient !== undefined;
  const isAmountLocked = amount !== undefined;
  const isSourceLocked = sourceChain !== undefined;
  const isDestLocked = destinationChain !== undefined;

  const recipientText = recipient ?? defaultRecipient ?? "";
  const amountText = amount ?? defaultAmount ?? "0.00";
  const sourceValue = sourceChain ?? initialSourceChain;
  const destValue = destinationChain ?? initialDestinationChain;
  const isBridge = sourceValue !== destValue;
  const networkChain = connectedChain ?? sourceValue;

  // Apply theme as inline CSS variables on a [data-whisk] wrapper, the
  // same way a real consumer would in their own stylesheet.
  const style: CSSProperties = {
    ...(theme.bg ? { ["--whisk-bg" as string]: theme.bg } : {}),
    ...(theme.card ? { ["--whisk-card" as string]: theme.card } : {}),
    ...(theme.fg ? { ["--whisk-fg" as string]: theme.fg } : {}),
    ...(theme.fgMuted ? { ["--whisk-fg-muted" as string]: theme.fgMuted } : {}),
    ...(theme.border ? { ["--whisk-border" as string]: theme.border } : {}),
    ...(theme.primary ? { ["--whisk-primary" as string]: theme.primary } : {}),
    ...(theme.primaryFg
      ? { ["--whisk-primary-fg" as string]: theme.primaryFg }
      : {}),
    ...(theme.fieldBg ? { ["--whisk-field-bg" as string]: theme.fieldBg } : {}),
    ...(theme.radius ? { ["--whisk-radius" as string]: theme.radius } : {}),
  };

  return (
    <div
      data-whisk
      style={style}
      className={"w-full max-w-[26rem] " + (className ?? "")}
    >
      <div
        style={{
          backgroundColor: "var(--whisk-card)",
          color: "var(--whisk-fg)",
          borderColor: "var(--whisk-border)",
          borderRadius: "var(--whisk-radius, 1rem)",
        }}
        className="flex flex-col gap-4 overflow-hidden border p-5 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.18)] sm:p-[1.375rem]"
      >
        <TopRow
          connectedAddress={connectedAddress}
          networkChain={networkChain}
        />

        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}
        >
          <ChainField
            label={isSourceLocked ? "From (locked)" : "From"}
            chain={sourceValue}
            locked={isSourceLocked}
          />
          <ChainField
            label={isDestLocked ? "To (locked)" : "To"}
            chain={destValue}
            locked={isDestLocked}
          />
        </div>

        <FieldBox
          label="Recipient"
          locked={isRecipientLocked}
          mono
          value={recipientText || "vitalik.eth, 0x…, etc."}
          placeholder={!recipientText}
        />

        <div>
          <FieldBox
            label="Amount"
            locked={isAmountLocked}
            amount
            value={amountText}
            suffix={<TokenChip token={token} bridgeLocked={isBridge} />}
          />
          <BalanceLine balance={balance} symbol={token} />
        </div>

        <PrimaryButton label={cta} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Top row                                                                   */
/* -------------------------------------------------------------------------- */

function TopRow({
  connectedAddress,
  networkChain,
}: {
  connectedAddress: string;
  networkChain: keyof typeof CHAIN_ICONS;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <NetworkPillMock chain={networkChain} />
      <AccountChipMock address={connectedAddress} />
    </div>
  );
}

function NetworkPillMock({ chain }: { chain: keyof typeof CHAIN_ICONS }) {
  const Icon = CHAIN_ICONS[chain];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
      style={{
        backgroundColor: "var(--whisk-field-bg, var(--whisk-bg))",
        borderColor: "var(--whisk-border)",
        color: "var(--whisk-fg)",
      }}
    >
      {Icon ? <Icon variant="branded" size={11} /> : null}
      {chain}
    </span>
  );
}

function AccountChipMock({ address }: { address: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium"
      style={{
        backgroundColor: "var(--whisk-field-bg, var(--whisk-bg))",
        borderColor: "var(--whisk-border)",
        color: "var(--whisk-fg)",
      }}
    >
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{
          background:
            "linear-gradient(135deg, var(--whisk-primary), var(--whisk-fg))",
        }}
      />
      <span className="font-mono text-[10.5px]">{address}</span>
      <ChevronDown className="h-2.5 w-2.5 opacity-60" />
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Chain picker field                                                        */
/* -------------------------------------------------------------------------- */

function ChainField({
  label,
  chain,
  locked,
}: {
  label: string;
  chain: keyof typeof CHAIN_ICONS;
  locked: boolean;
}) {
  const Icon = CHAIN_ICONS[chain];
  return (
    <label
      className="flex min-w-0 flex-col gap-0.5 border px-2 py-1.5"
      style={{
        backgroundColor: "var(--whisk-bg)",
        borderColor: "var(--whisk-border)",
        borderRadius: "calc(var(--whisk-radius, 1rem) * 0.65)",
        color: "var(--whisk-fg)",
      }}
    >
      <FieldLabel locked={locked}>{label}</FieldLabel>
      <span className="flex items-center justify-between gap-1.5">
        <span className="flex min-w-0 items-center gap-1.5">
          {Icon ? <Icon variant="branded" size={14} /> : null}
          <span className="truncate text-[12.5px] font-medium">{chain}</span>
        </span>
        {locked ? (
          <Lock className="h-3 w-3 opacity-60" />
        ) : (
          <ChevronDown className="h-3 w-3 opacity-60" />
        )}
      </span>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Generic field box (recipient + amount)                                    */
/* -------------------------------------------------------------------------- */

function FieldBox({
  label,
  locked,
  mono,
  amount,
  value,
  placeholder,
  suffix,
}: {
  label: string;
  locked?: boolean;
  mono?: boolean;
  amount?: boolean;
  value: string;
  placeholder?: boolean;
  suffix?: ReactNode;
}) {
  return (
    <label
      className="flex flex-col gap-0.5 border px-3 py-2"
      style={{
        backgroundColor: "var(--whisk-bg)",
        borderColor: "var(--whisk-border)",
        borderRadius: "calc(var(--whisk-radius, 1rem) * 0.65)",
        color: "var(--whisk-fg)",
      }}
    >
      <FieldLabel locked={locked}>{label}</FieldLabel>
      <span className="flex items-center justify-between gap-2">
        <span
          className={
            (amount ? "text-[1.375rem] font-semibold tracking-tight " : "") +
            (mono ? "font-mono text-[12px] " : "") +
            "truncate"
          }
          style={{
            color: placeholder ? "var(--whisk-fg-muted)" : "var(--whisk-fg)",
          }}
        >
          {value}
        </span>
        {suffix}
      </span>
    </label>
  );
}

function FieldLabel({
  locked,
  children,
}: {
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[9.5px] font-medium uppercase tracking-wider"
      style={{ color: "var(--whisk-fg-muted)" }}
    >
      {locked ? <Lock className="h-2.5 w-2.5 opacity-70" /> : null}
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Token chip (amount suffix)                                                */
/* -------------------------------------------------------------------------- */

function TokenChip({
  token,
  bridgeLocked,
}: {
  token: string;
  bridgeLocked?: boolean;
}) {
  const Icon = TOKEN_ICONS[token];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium"
      style={{
        backgroundColor: "var(--whisk-field-bg, var(--whisk-card))",
        borderColor: "var(--whisk-border)",
        color: "var(--whisk-fg)",
      }}
      title={bridgeLocked ? "Bridges support USDC only" : undefined}
    >
      {Icon ? (
        <Icon variant="branded" size={14} />
      ) : (
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: "var(--whisk-primary)" }}
        />
      )}
      {token}
      {bridgeLocked ? (
        <Lock className="h-2.5 w-2.5 opacity-60" />
      ) : (
        <ChevronDown className="h-2.5 w-2.5 opacity-60" />
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Balance line                                                              */
/* -------------------------------------------------------------------------- */

function BalanceLine({ balance, symbol }: { balance: string; symbol: string }) {
  return (
    <div
      className="mt-1.5 flex items-center justify-between text-[10.5px]"
      style={{ color: "var(--whisk-fg-muted)" }}
    >
      <span>
        You have{" "}
        <span className="font-mono" style={{ color: "var(--whisk-fg)" }}>
          {balance} {symbol}
        </span>
      </span>
      <button
        type="button"
        tabIndex={-1}
        className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{
          color: "var(--whisk-primary)",
          backgroundColor:
            "color-mix(in srgb, var(--whisk-primary) 10%, transparent)",
        }}
      >
        MAX
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Primary CTA                                                               */
/* -------------------------------------------------------------------------- */

function PrimaryButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      className="mt-0.5 flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold"
      style={{
        backgroundColor: "var(--whisk-primary)",
        color: "var(--whisk-primary-fg)",
        borderRadius: "calc(var(--whisk-radius, 1rem) * 0.65)",
      }}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}
