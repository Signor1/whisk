import type { InvoiceQuery } from "../lib/types";
import { makeInvoiceNonce } from "../lib/order";

type ValidInvoice = Extract<InvoiceQuery, { valid: true }>;

export type InvoiceCardProps = {
  invoice: ValidInvoice;
  paid: boolean;
};

export function InvoiceCard({ invoice, paid }: InvoiceCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_2px_3px_rgba(42,32,24,0.04),0_22px_50px_-26px_rgba(42,32,24,0.18)]">
      <Banner invoice={invoice} paid={paid} />
      <Body invoice={invoice} />
    </section>
  );
}

function Banner({ invoice, paid }: { invoice: ValidInvoice; paid: boolean }) {
  return (
    <div
      className="relative px-7 py-6"
      style={{
        background:
          "linear-gradient(135deg, #f9f4ea 0%, #f5b89c 50%, #e85a3d 100%)",
      }}
    >
      {paid && <PaidStamp />}
      <Brand />
      <h1 className="m-0 mt-6 font-display text-[2.4rem] leading-[1.05] tracking-tight text-ink-soft sm:text-[3rem]">
        {invoice.memo || "Payment request"}
      </h1>
      <p className="m-0 mt-2 text-[13px] text-ink-soft">
        Invoice #INV-2026-{makeInvoiceNonce(invoice.amount)} · Due upon receipt
      </p>
    </div>
  );
}

function PaidStamp() {
  return (
    <span
      aria-hidden
      className="absolute right-6 top-6 rounded-md border-2 border-sage-deep px-4 py-1 font-display text-[16px] uppercase tracking-[0.18em] text-sage-deep"
      style={{
        animation: "sh-paid 540ms cubic-bezier(0.2, 1.5, 0.4, 1)",
        transform: "rotate(-8deg)",
      }}
    >
      Paid
    </span>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-full font-display italic text-paper"
        style={{
          background: "linear-gradient(135deg, #e85a3d 0%, #b8421e 100%)",
          fontSize: "16px",
        }}
      >
        ✿
      </span>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[16px] tracking-tight text-ink">
          Studio Hibiscus
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          Independent design · Lisbon
        </span>
      </div>
    </div>
  );
}

function Body({ invoice }: { invoice: ValidInvoice }) {
  return (
    <div className="p-7">
      <Meta invoice={invoice} />
      <div className="h-px bg-line" />
      <LineItems invoice={invoice} />
      <Totals invoice={invoice} />
    </div>
  );
}

function Meta({ invoice }: { invoice: ValidInvoice }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-5 text-[13px] sm:grid-cols-3">
      <Detail
        label="Issued by"
        value="Studio Hibiscus"
        sub="hello@studiohibiscus.co"
      />
      <Detail label="Issued to" value="Your client" sub="(via shared link)" />
      <Detail
        label="Settle on"
        value={invoice.chainLabel}
        sub="Locked from URL"
      />
    </div>
  );
}

function Detail({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col leading-snug">
      <span className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">
        {label}
      </span>
      <span className="text-[13px] text-ink">{value}</span>
      {sub && <span className="text-[11px] text-ink-muted">{sub}</span>}
    </div>
  );
}

function LineItems({ invoice }: { invoice: ValidInvoice }) {
  return (
    <table className="mt-5 w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-[0.14em] text-ink-muted">
          <th className="pb-2 font-normal">Item</th>
          <th className="pb-2 text-right font-normal">Qty</th>
          <th className="pb-2 text-right font-normal">Rate</th>
          <th className="pb-2 text-right font-normal">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-line">
          <td className="py-3">{invoice.memo || "Services rendered"}</td>
          <td className="py-3 text-right tabular-nums">1</td>
          <td className="py-3 text-right tabular-nums">${invoice.amount}</td>
          <td className="py-3 text-right font-medium tabular-nums">
            ${invoice.amount}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Totals({ invoice }: { invoice: ValidInvoice }) {
  return (
    <div className="mt-5 flex flex-col gap-1.5 border-t border-line pt-5">
      <Row label="Subtotal" value={`$${invoice.amount}`} />
      <Row label="Tax" value="$0.00" muted />
      <Row label="Total" value={`$${invoice.amount} USDC`} big />
    </div>
  );
}

function Row({
  label,
  value,
  big,
  muted,
}: {
  label: string;
  value: string;
  big?: boolean;
  muted?: boolean;
}) {
  if (big) {
    return (
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-2">
        <dt className="m-0 text-[11px] uppercase tracking-[0.16em] text-ink-soft">
          {label}
        </dt>
        <dd className="m-0 font-display text-[1.6rem] text-coral-deep">
          {value}
        </dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between text-sm">
      <dt className={"m-0 " + (muted ? "text-ink-muted" : "text-ink-soft")}>
        {label}
      </dt>
      <dd
        className={
          "m-0 tabular-nums " + (muted ? "text-ink-muted" : "text-ink")
        }
      >
        {value}
      </dd>
    </div>
  );
}
