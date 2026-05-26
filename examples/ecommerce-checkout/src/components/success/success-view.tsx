"use client";

import type { HydratedLine } from "../../hooks/use-cart";
import { explorerUrl, shortTxHash } from "../../lib/order";

export type SuccessViewProps = {
  orderId: string;
  txHash?: string;
  cart: HydratedLine[];
  totalStr: string;
  onShopAgain: () => void;
};

export function SuccessView({
  orderId,
  txHash,
  cart,
  totalStr,
  onShopAgain,
}: SuccessViewProps) {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 py-4 text-center">
      <SuccessBadge />
      <p className="m-0 text-[11px] uppercase tracking-[0.2em] text-tobacco">
        Order placed
      </p>
      <h2 className="m-0 font-display text-3xl tracking-tight sm:text-[2.2rem]">
        Thanks for the order.
      </h2>
      <p className="m-0 leading-relaxed text-charcoal-soft">
        We've received your payment of <strong>${totalStr} USDC</strong>. A
        shipping confirmation with the tracking number is on its way.
      </p>

      <OrderReceipt
        orderId={orderId}
        totalStr={totalStr}
        txHash={txHash}
        cart={cart}
      />

      <button
        type="button"
        onClick={onShopAgain}
        className="mt-2 cursor-pointer rounded-full border border-charcoal bg-transparent px-5 py-2.5 text-sm text-charcoal hover:bg-charcoal hover:text-sand"
      >
        Back to the shop
      </button>
    </section>
  );
}

function SuccessBadge() {
  return (
    <div
      aria-hidden
      className="mb-2 flex h-[54px] w-[54px] items-center justify-center rounded-full bg-leaf text-[1.6rem] text-white shadow-[0_8px_20px_-8px_rgba(90,138,74,0.5),inset_0_-2px_4px_rgba(0,0,0,0.12)]"
      style={{ animation: "ah-pop 360ms cubic-bezier(0.2, 1.4, 0.4, 1)" }}
    >
      ✓
    </div>
  );
}

function OrderReceipt({
  orderId,
  totalStr,
  txHash,
  cart,
}: {
  orderId: string;
  totalStr: string;
  txHash?: string;
  cart: HydratedLine[];
}) {
  return (
    <div className="mt-2 flex w-full flex-col gap-2.5 rounded-xl border border-line bg-paper p-5 text-left">
      <ReceiptRow label="Order" value={`#${orderId}`} mono />
      <ReceiptRow label="Total" value={`$${totalStr} USDC`} />
      {txHash && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-charcoal-muted">Receipt</span>
          <a
            href={explorerUrl(txHash)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[13px] text-tobacco-deep no-underline hover:underline"
          >
            {shortTxHash(txHash)} ↗
          </a>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1.5 border-t border-line pt-3">
        {cart.map((c) => (
          <span
            key={`${c.product.id}-${c.variant.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-sand-2 py-0.5 pl-0.5 pr-2 text-xs text-charcoal-soft"
          >
            <span
              aria-hidden
              className="h-[18px] w-[18px] rounded-full bg-cover"
              style={{ background: c.product.art }}
            />
            {c.qty}× {c.product.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal-muted">{label}</span>
      <strong className={mono ? "font-mono text-[13px] text-tobacco-deep" : ""}>
        {value}
      </strong>
    </div>
  );
}
