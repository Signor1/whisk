"use client";

import type { HydratedLine, CartTotals } from "../../hooks/use-cart";
import { OrderSummary } from "./order-summary";
import { PaymentAside } from "./payment-aside";

export type CheckoutViewProps = {
  cart: HydratedLine[];
  totals: CartTotals;
  onUpdateQty: (index: number, qty: number) => void;
  onBackToShop: () => void;
  onPaid: (txHash?: string) => void;
};

export function CheckoutView({
  cart,
  totals,
  onUpdateQty,
  onBackToShop,
  onPaid,
}: CheckoutViewProps) {
  return (
    <section className="flex flex-col gap-6">
      <CheckoutHeader onBack={onBackToShop} />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <OrderSummary cart={cart} totals={totals} onUpdateQty={onUpdateQty} />
        <PaymentAside totalStr={totals.totalStr} onPaid={onPaid} />
      </div>
    </section>
  );
}

function CheckoutHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer border-none bg-transparent text-[13px] text-charcoal-soft hover:text-charcoal"
      >
        ← Continue shopping
      </button>
      <ProgressBreadcrumb />
    </header>
  );
}

function ProgressBreadcrumb() {
  return (
    <div
      aria-label="Checkout progress"
      className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.18em] text-charcoal-muted"
    >
      <span>Cart</span>
      <span aria-hidden className="opacity-50">
        ›
      </span>
      <span>Shipping</span>
      <span aria-hidden className="opacity-50">
        ›
      </span>
      <strong className="font-semibold text-charcoal">Payment</strong>
    </div>
  );
}
