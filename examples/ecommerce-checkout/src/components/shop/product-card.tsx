"use client";

import { useState } from "react";
import type { Product } from "../../data/catalog";

export type ProductCardProps = {
  product: Product;
  /** Set of "{productId}:{variantId}" already in the cart, for the "Added" state. */
  inCart: Set<string>;
  onAdd: (variantId: string) => void;
};

export function ProductCard({ product, inCart, onAdd }: ProductCardProps) {
  const [variantId, setVariantId] = useState(product.variants[0]!.id);
  const added = inCart.has(`${product.id}:${variantId}`);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_1px_2px_rgba(56,38,22,0.04),0_8px_28px_-12px_rgba(56,38,22,0.14)]">
      <div
        className="relative flex aspect-[4/5] items-start justify-end overflow-hidden p-3"
        style={{ backgroundColor: product.fallbackColor }}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 24%), linear-gradient(0deg, rgba(0,0,0,0.18) 0%, transparent 32%)",
          }}
        />
        <span className="relative z-[1] rounded-full bg-white/85 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-charcoal backdrop-blur-[4px]">
          {product.category}
        </span>
      </div>

      <div className="flex flex-col gap-2 p-4 pt-3">
        <header className="flex items-baseline justify-between gap-2">
          <h3 className="m-0 font-display text-[17px] leading-tight tracking-tight">
            {product.name}
          </h3>
          <span className="font-medium tabular-nums">${product.priceUsdc}</span>
        </header>
        <p className="m-0 min-h-[2.4em] text-[13px] leading-snug text-charcoal-muted">
          {product.caption}
        </p>

        {product.variants.length > 1 && (
          <VariantPicker
            variants={product.variants}
            selectedId={variantId}
            onSelect={setVariantId}
          />
        )}

        <button
          type="button"
          aria-pressed={added}
          onClick={() => onAdd(variantId)}
          className={
            "mt-2 h-[38px] rounded-lg border text-[13px] font-medium tracking-wide transition-colors " +
            (added
              ? "border-tobacco bg-tobacco text-white"
              : "border-charcoal bg-transparent text-charcoal hover:bg-charcoal hover:text-sand")
          }
        >
          {added ? "✓ Added to cart" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

function VariantPicker({
  variants,
  selectedId,
  onSelect,
}: {
  variants: Product["variants"];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Variant"
      className="mt-0.5 inline-flex flex-wrap gap-1.5"
    >
      {variants.map((v) => (
        <button
          key={v.id}
          role="radio"
          aria-checked={selectedId === v.id}
          type="button"
          onClick={() => onSelect(v.id)}
          className={
            "rounded-full border px-2.5 py-0.5 text-xs transition-colors " +
            (selectedId === v.id
              ? "border-charcoal bg-charcoal text-sand"
              : "border-line text-charcoal-soft hover:border-charcoal-soft")
          }
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
