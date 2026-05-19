"use client";

import { useState } from "react";
import { WhiskSend } from "@signordev/whisk-react";

const MERCHANT_ADDRESS = "0x5B8ecaB7096F8aBED873D246629ef9f05f467605";

type Product = {
  id: string;
  name: string;
  blurb: string;
  priceUsdc: string;
  glyph: string;
  gradient: string;
  category: string;
};

const CATALOG: Product[] = [
  {
    id: "handbook",
    name: "Whisk handbook · annotated edition",
    blurb:
      "200-page softcover. Earth-tone palette, nine chapters, signed by the author.",
    priceUsdc: "49.99",
    glyph: "W",
    gradient: "linear-gradient(135deg, #d65c3c 0%, #6e4d54 100%)",
    category: "Books",
  },
  {
    id: "tshirt",
    name: "Cream / wine tee — fitted",
    blurb:
      "Heavyweight 240gsm cotton, double-stitched hem, matches the widget's palette.",
    priceUsdc: "32.00",
    glyph: "T",
    gradient: "linear-gradient(135deg, #b04f3e 0%, #f5e8d6 100%)",
    category: "Apparel",
  },
  {
    id: "pin",
    name: "Brand pin set (3 pieces)",
    blurb:
      "Hard enamel pins · whisk wordmark, stablecoin glyph, terracotta dot. Magnetic backs.",
    priceUsdc: "18.50",
    glyph: "◉",
    gradient: "linear-gradient(135deg, #c98c56 0%, #6e4d54 100%)",
    category: "Accessories",
  },
  {
    id: "sticker-pack",
    name: "Sticker pack · 12 designs",
    blurb:
      "Vinyl, weather-resistant, palm-sized. Stick on a laptop, post a thread, ship.",
    priceUsdc: "9.00",
    glyph: "✦",
    gradient: "linear-gradient(135deg, #6e4d54 0%, #d65c3c 100%)",
    category: "Accessories",
  },
];

type CartItem = { product: Product };

export function ExampleCheckout() {
  const [cart, setCart] = useState<CartItem | null>(null);
  const [paid, setPaid] = useState<{
    txHash?: string;
    product: Product;
  } | null>(null);

  if (paid) {
    return (
      <article className="storefront__panel storefront__success">
        <header>
          <span className="storefront__success-badge">Order placed</span>
          <h2>Thanks for buying {paid.product.name.toLowerCase()}.</h2>
          <p>
            We've received your payment.{" "}
            {paid.txHash ? (
              <a
                href={`https://testnet.arcscan.app/tx/${paid.txHash}`}
                target="_blank"
                rel="noreferrer"
              >
                View tx on Arc Explorer
              </a>
            ) : null}{" "}
            You'll get a shipping email when this leaves the warehouse.
          </p>
        </header>
        <button
          type="button"
          className="storefront__chip"
          onClick={() => {
            setPaid(null);
            setCart(null);
          }}
        >
          ← Back to store
        </button>
      </article>
    );
  }

  if (cart) {
    return (
      <article className="storefront__panel storefront__checkout">
        <header className="storefront__checkout-head">
          <button
            type="button"
            className="storefront__back"
            onClick={() => setCart(null)}
          >
            ← Continue shopping
          </button>
          <h2>Checkout</h2>
        </header>

        <div className="storefront__order">
          <div
            className="storefront__art storefront__art--small"
            style={{ background: cart.product.gradient }}
          >
            <span className="storefront__glyph">{cart.product.glyph}</span>
          </div>
          <div>
            <p className="storefront__order-label">{cart.product.category}</p>
            <h3>{cart.product.name}</h3>
            <p className="storefront__order-blurb">{cart.product.blurb}</p>
          </div>
          <div className="storefront__order-total">
            <span>Total</span>
            <strong>${cart.product.priceUsdc}</strong>
            <span className="storefront__order-token">USDC · Arc Testnet</span>
          </div>
        </div>

        <WhiskSend
          amount={cart.product.priceUsdc}
          recipient={MERCHANT_ADDRESS}
          sourceChain="Arc_Testnet"
          destinationChain="Arc_Testnet"
          onSuccess={({ finalTxHash }) =>
            setPaid({ txHash: finalTxHash, product: cart.product })
          }
        />
      </article>
    );
  }

  return (
    <article className="storefront__panel">
      <header className="storefront__head">
        <div>
          <h2>Today's drops</h2>
          <p>Pay-with-USDC, settles in seconds, no card details required.</p>
        </div>
        <span className="storefront__pill">Arc Testnet · live</span>
      </header>

      <div className="storefront__grid">
        {CATALOG.map((p) => (
          <button
            key={p.id}
            type="button"
            className="storefront__card"
            onClick={() => setCart({ product: p })}
          >
            <div
              className="storefront__art"
              style={{ background: p.gradient }}
              aria-hidden="true"
            >
              <span className="storefront__glyph">{p.glyph}</span>
            </div>
            <div className="storefront__card-body">
              <span className="storefront__category">{p.category}</span>
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
              <div className="storefront__card-foot">
                <span className="storefront__price">${p.priceUsdc}</span>
                <span className="storefront__buy">Buy →</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </article>
  );
}
