"use client";

import { WhiskSend } from "@usewhisk/react";
import { MERCHANT_ADDRESS } from "../../data/catalog";

export type PaymentAsideProps = {
  /** Total in USDC, already formatted to 2 decimals. */
  totalStr: string;
  onPaid: (txHash?: string) => void;
};

/**
 * Payment side-rail. All four `<WhiskSend>` props are pinned at this step —
 * the customer can't edit the amount, recipient, or chain. That's the safe
 * default for a checkout: every value comes from your cart, not from input.
 */
export function PaymentAside({ totalStr, onPaid }: PaymentAsideProps) {
  return (
    <aside className="self-start rounded-xl border border-line bg-paper p-5 sm:sticky sm:top-5 sm:p-7">
      <header className="flex items-center justify-between gap-3">
        <h2 className="m-0 font-display text-xl">Payment</h2>
        <PaymentMethodTabs />
      </header>

      <p className="mt-4 text-[13px] leading-relaxed text-charcoal-muted">
        Amount and merchant address are locked from the cart. Bridge fees are
        added to your total, so Atelier Hibiscus receives the exact price.
      </p>

      <div className="ah-widget mt-4 flex justify-center">
        <WhiskSend
          amount={totalStr}
          recipient={MERCHANT_ADDRESS}
          sourceChain="Base_Sepolia"
          destinationChain="Base_Sepolia"
          onSuccess={({ finalTxHash }) => onPaid(finalTxHash)}
        />
      </div>

      <p className="mt-4 text-center text-[11px] uppercase tracking-[0.16em] text-charcoal-muted">
        Powered by Whisk · Built on Circle App Kit
      </p>
    </aside>
  );
}

function PaymentMethodTabs() {
  return (
    <div
      role="tablist"
      aria-label="Payment method"
      className="inline-flex rounded-full bg-sand-2 p-[3px] text-xs"
    >
      <span role="tab" className="rounded-full px-3 py-1 text-charcoal-muted">
        Card
      </span>
      <span
        role="tab"
        aria-selected
        className="rounded-full bg-charcoal px-3 py-1 text-sand"
      >
        USDC
      </span>
    </div>
  );
}
