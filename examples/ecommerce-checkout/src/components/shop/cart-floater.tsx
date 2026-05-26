"use client";

export type CartFloaterProps = {
  count: number;
  total: number;
  onCheckout: () => void;
};

export function CartFloater({ count, total, onCheckout }: CartFloaterProps) {
  return (
    <div
      className="fixed bottom-5 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-4 rounded-full bg-charcoal py-2 pl-4 pr-2 text-[13px] text-sand shadow-[0_6px_20px_-4px_rgba(0,0,0,0.25),0_2px_6px_rgba(0,0,0,0.18)]"
      style={{ animation: "ah-floater-in 220ms ease-out" }}
    >
      <span>
        <strong>{count}</strong> item{count === 1 ? "" : "s"} ·{" "}
        <strong>${total.toFixed(2)}</strong>
      </span>
      <button
        type="button"
        onClick={onCheckout}
        className="cursor-pointer rounded-full bg-sand px-4 py-1.5 text-[13px] font-medium text-charcoal"
      >
        Checkout
      </button>
    </div>
  );
}
