"use client";

import type { HydratedLine, CartTotals } from "../../hooks/use-cart";

export type OrderSummaryProps = {
  cart: HydratedLine[];
  totals: CartTotals;
  onUpdateQty: (index: number, qty: number) => void;
};

export function OrderSummary({ cart, totals, onUpdateQty }: OrderSummaryProps) {
  return (
    <div className="rounded-xl border border-line bg-paper p-5 sm:p-7">
      <h2 className="m-0 mb-4 font-display text-xl">Your order</h2>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {cart.map((line, i) => (
          <LineItemRow
            key={`${line.product.id}-${line.variant.id}`}
            line={line}
            onDecrement={() => onUpdateQty(i, line.qty - 1)}
            onIncrement={() => onUpdateQty(i, line.qty + 1)}
          />
        ))}
      </ul>

      <dl className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
        <Row label="Subtotal" value={`$${totals.subtotal.toFixed(2)}`} />
        <Row label="Shipping" value="Free over $50" muted />
        <Row label="Tax" value="$0.00" muted />
        <Row label="Total" value={`$${totals.total.toFixed(2)} USDC`} big />
      </dl>
    </div>
  );
}

function LineItemRow({
  line,
  onDecrement,
  onIncrement,
}: {
  line: HydratedLine;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <li className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 border-b border-line py-2 last:border-b-0">
      <span
        aria-hidden
        className="h-14 w-14 shrink-0 overflow-hidden rounded-lg"
        style={{ backgroundColor: line.product.fallbackColor }}
      >
        <img
          src={line.product.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </span>
      <div className="flex flex-col">
        <span className="text-[15px]">{line.product.name}</span>
        <span className="inline-flex items-center gap-1.5 text-xs text-charcoal-muted">
          {line.product.variants.length > 1 && (
            <>
              <span>{line.variant.label}</span>
              <span aria-hidden className="opacity-50">
                ·
              </span>
            </>
          )}
          <span>${line.product.priceUsdc.toFixed(2)} each</span>
        </span>
      </div>
      <QtyStepper qty={line.qty} onDec={onDecrement} onInc={onIncrement} />
      <span className="min-w-[4.5rem] text-right font-medium tabular-nums">
        ${(line.qty * line.product.priceUsdc).toFixed(2)}
      </span>
    </li>
  );
}

function QtyStepper({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full bg-sand-2 p-0.5">
      <button
        type="button"
        onClick={onDec}
        aria-label="Decrease quantity"
        className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[15px] text-charcoal-soft hover:bg-paper hover:text-charcoal"
      >
        −
      </button>
      <span className="min-w-[22px] text-center text-[13px] tabular-nums">
        {qty}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Increase quantity"
        className="flex h-[26px] w-[26px] cursor-pointer items-center justify-center rounded-full border-none bg-transparent text-[15px] text-charcoal-soft hover:bg-paper hover:text-charcoal"
      >
        +
      </button>
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
      <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
        <dt className="m-0 text-[11px] uppercase tracking-wider text-charcoal-soft">
          {label}
        </dt>
        <dd className="m-0 font-display text-[1.4rem]">{value}</dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between text-sm">
      <dt className={"m-0 " + (muted ? "text-charcoal-muted" : "")}>{label}</dt>
      <dd className={"m-0 " + (muted ? "text-charcoal-muted" : "")}>{value}</dd>
    </div>
  );
}
