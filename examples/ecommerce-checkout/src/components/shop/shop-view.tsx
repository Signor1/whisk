"use client";

import { CATALOG, type ProductId } from "../../data/catalog";
import type { HydratedLine } from "../../hooks/use-cart";
import { ProductCard } from "./product-card";

export type ShopViewProps = {
  cart: HydratedLine[];
  onAdd: (productId: ProductId, variantId: string) => void;
};

export function ShopView({ cart, onAdd }: ShopViewProps) {
  const inCart = new Set(cart.map((c) => `${c.product.id}:${c.variant.id}`));
  return (
    <>
      <section className="mt-4 flex max-w-2xl flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-tobacco">
          Spring drop · 04
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl md:text-[3.4rem]">
          Goods made slowly.{" "}
          <em className="font-display italic text-tobacco-deep">
            Settled instantly.
          </em>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-charcoal-soft sm:text-[17px]">
          Five new things in the studio this week. Pay with USDC at checkout —
          no card forms, no exchange detour, no chargebacks.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CATALOG.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            inCart={inCart}
            onAdd={(variantId) => onAdd(p.id, variantId)}
          />
        ))}
      </section>
    </>
  );
}
