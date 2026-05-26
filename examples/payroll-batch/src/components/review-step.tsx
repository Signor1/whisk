import { PAYEES, type Payee } from "../data/payees";
import { Steps } from "./steps";

export type ReviewStepProps = {
  included: Payee[];
  excluded: Set<string>;
  total: number;
  onToggle: (id: string) => void;
  onContinue: () => void;
};

export function ReviewStep({
  included,
  excluded,
  total,
  onToggle,
  onContinue,
}: ReviewStepProps) {
  return (
    <section className="flex flex-col gap-6">
      <Header />
      <Steps active={1} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <PayeeList
          included={included.length}
          totalPayees={PAYEES.length}
          excluded={excluded}
          onToggle={onToggle}
        />
        <BatchSummary
          included={included.length}
          totalPayees={PAYEES.length}
          total={total}
          onContinue={onContinue}
        />
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-burgundy">
        Step 1 of 3 · Review the run
      </p>
      <h1 className="m-0 font-display text-[2.6rem] leading-[1.05] tracking-tight text-claret-deep sm:text-[3.4rem]">
        May payroll,{" "}
        <em className="font-display italic text-burgundy">in order.</em>
      </h1>
      <p className="m-0 max-w-2xl text-[16px] leading-relaxed text-ink-soft">
        Exclude any payee you're holding back this cycle. Studio Fortune
        dispatches each transfer one-by-one — chains and amounts are pinned, you
        only confirm signatures.
      </p>
    </header>
  );
}

function PayeeList({
  included,
  totalPayees,
  excluded,
  onToggle,
}: {
  included: number;
  totalPayees: number;
  excluded: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-line bg-bone/40 p-5 sm:p-6">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="m-0 font-display text-xl text-claret-deep">
          {included} of {totalPayees} included
        </h2>
        <span className="rounded-full border border-line bg-ivory px-2.5 py-0.5 text-[11px] uppercase tracking-wider text-ink-muted">
          May 1–31
        </span>
      </header>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {PAYEES.map((payee) => (
          <PayeeRow
            key={payee.id}
            payee={payee}
            isExcluded={excluded.has(payee.id)}
            onToggle={() => onToggle(payee.id)}
          />
        ))}
      </ul>
    </article>
  );
}

function PayeeRow({
  payee,
  isExcluded,
  onToggle,
}: {
  payee: Payee;
  isExcluded: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={
        "grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 rounded-lg border bg-ivory p-3 transition-all " +
        (isExcluded
          ? "border-line opacity-50"
          : "border-line hover:border-rose")
      }
    >
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-bold text-ivory"
        style={{
          background: `linear-gradient(135deg, hsl(${payee.hue} 60% 50%), hsl(${payee.hue} 70% 30%))`,
        }}
      >
        {payee.initials}
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[14px] text-ink">{payee.name}</span>
        <span className="text-[11px] text-ink-muted">
          {payee.role} · {payee.chain}
        </span>
      </div>
      <span className="font-display text-[16px] tabular-nums text-claret-deep">
        ${payee.amount.toLocaleString()}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={
          "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider " +
          (isExcluded
            ? "border-line bg-ivory text-ink-muted hover:border-claret hover:text-claret"
            : "border-claret-deep/20 bg-blush/30 text-claret-deep hover:bg-claret hover:text-ivory")
        }
      >
        {isExcluded ? "Add" : "Skip"}
      </button>
    </li>
  );
}

function BatchSummary({
  included,
  totalPayees,
  total,
  onContinue,
}: {
  included: number;
  totalPayees: number;
  total: number;
  onContinue: () => void;
}) {
  return (
    <aside className="self-start rounded-2xl border border-line bg-blush/30 p-6 sm:sticky sm:top-5">
      <h2 className="m-0 font-display text-lg text-claret-deep">
        Batch summary
      </h2>
      <p className="m-0 mt-1 text-[12px] text-ink-muted">
        May cycle · Studio Fortune treasury
      </p>

      <dl className="mt-5 flex flex-col gap-2.5 text-[14px]">
        <SummaryRow label="Payees" value={`${included} of ${totalPayees}`} />
        <SummaryRow
          label="Total to pay"
          value={`$${total.toLocaleString()} USDC`}
        />
        <SummaryRow label="Chains used" value="3 testnets" />
        <SummaryRow
          label="Est. wall time"
          value={`${included * 0.5} min`}
          muted
        />
      </dl>

      <button
        type="button"
        onClick={onContinue}
        disabled={included === 0}
        className="mt-5 w-full rounded-lg bg-claret py-3 text-[15px] font-medium text-ivory transition-colors hover:bg-claret-deep disabled:opacity-40"
      >
        Continue to dispatch →
      </button>
      <p className="m-0 mt-2 text-center text-[11px] text-ink-muted">
        You'll confirm each transfer separately.
      </p>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-line pb-2 last:border-b-0">
      <dt
        className={
          "m-0 text-[12px] uppercase tracking-wider " +
          (muted ? "text-ink-muted" : "text-claret")
        }
      >
        {label}
      </dt>
      <dd className={"m-0 font-medium " + (muted ? "text-ink-muted" : "")}>
        {value}
      </dd>
    </div>
  );
}
