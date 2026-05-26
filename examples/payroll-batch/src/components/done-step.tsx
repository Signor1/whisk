import type { Payee } from "../data/payees";
import { Steps } from "./steps";

export type DoneStepProps = {
  included: Payee[];
  total: number;
  onReset: () => void;
};

export function DoneStep({ included, total, onReset }: DoneStepProps) {
  return (
    <section className="flex flex-col gap-6">
      <Header />
      <Steps active={3} />
      <Receipt included={included} total={total} onReset={onReset} />
    </section>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-[11px] uppercase tracking-[0.22em] text-emerald">
        Step 3 of 3 · Run complete
      </p>
      <h1 className="m-0 font-display text-[2.6rem] leading-[1.05] tracking-tight text-claret-deep sm:text-[3.2rem]">
        May payroll{" "}
        <em className="font-display italic text-emerald">cleared.</em>
      </h1>
    </header>
  );
}

function Receipt({
  included,
  total,
  onReset,
}: {
  included: Payee[];
  total: number;
  onReset: () => void;
}) {
  return (
    <article className="rounded-2xl border border-line bg-bone/40 p-6">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="m-0 font-display text-xl text-claret-deep">
          Run #2026-05-A
        </h2>
        <span className="rounded-full bg-emerald/15 px-2.5 py-1 text-[11px] uppercase tracking-wider text-emerald">
          ✓ Settled
        </span>
      </header>

      <p className="m-0 mb-4 text-[15px] text-ink-soft">
        {included.length} payees funded · ${total.toLocaleString()} USDC out the
        door. Each transfer is on-chain and verifiable. Receipts are en route to
        the team via email.
      </p>

      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {included.map((payee) => (
          <ReceiptRow key={payee.id} payee={payee} />
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-[14px] text-ink-soft">
          Total dispatched ·{" "}
          <strong className="font-display text-claret-deep">
            ${total.toLocaleString()} USDC
          </strong>
        </span>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-claret bg-transparent px-5 py-2 text-[13px] text-claret hover:bg-claret hover:text-ivory"
        >
          Start a new run →
        </button>
      </div>
    </article>
  );
}

function ReceiptRow({ payee }: { payee: Payee }) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-line bg-ivory p-3">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-ivory"
          style={{
            background: `linear-gradient(135deg, hsl(${payee.hue} 60% 50%), hsl(${payee.hue} 70% 30%))`,
          }}
        >
          {payee.initials}
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] text-ink">{payee.name}</span>
          <span className="text-[11px] text-ink-muted">{payee.chain}</span>
        </div>
      </div>
      <span className="font-display text-[15px] tabular-nums text-claret-deep">
        ${payee.amount.toLocaleString()}
      </span>
    </li>
  );
}
