# whisk-example-ecommerce-checkout

**Atelier Hibiscus** — an editorial DTC storefront with a 5-product
catalog, multi-item cart, two-step checkout, and order confirmation.
Pay-with-USDC at checkout via Whisk.

A real-feel checkout flow built on Tailwind CSS v4, demonstrating Whisk
locked into a fixed price + merchant address at the payment step.

## What this recipe shows

- A complete shop → cart → checkout → success flow, not a sandbox card.
- Multi-item cart with line items, quantity steppers, and product
  variants (sizes, colors).
- All four controlled props pinned at the payment step: `amount`,
  `recipient`, `sourceChain`, `destinationChain` — the customer can't
  edit the price or pick a chain.
- Widget themed to inherit the storefront palette via the
  `[data-whisk]` CSS variables.
- `onSuccess` flips state to an order confirmation with a tx hash, order
  ID, and itemized list. In a real app this is where your backend would
  catch a webhook and finalize the order.
- Runs `feeBearer: "sender"` so the customer covers the bridge fees and
  the merchant receives the exact cart total.

## Stack

- **Next.js 15** App Router
- **Tailwind CSS v4** via `@tailwindcss/postcss` (theme tokens live in
  `src/app/globals.css` under `@theme`, no `tailwind.config.js`)
- **@usewhisk/react** for the `<WhiskSend>` widget

## Run

```bash
pnpm install
cp .env.example .env.local  # optional: paste a WalletConnect project ID
pnpm --filter @usewhisk/example-ecommerce-checkout dev
```

Open <http://localhost:3010>. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is
optional — without it MetaMask / Rabby / Coinbase Wallet still work, you
just won't see the WalletConnect QR option.

## Adapt for your project

Inside this monorepo, the example consumes `@usewhisk/react` and
`@usewhisk/core` via `workspace:*`. When you copy this recipe into
your own app, install the published packages instead:

```bash
pnpm add @usewhisk/react @usewhisk/core
pnpm add -D tailwindcss @tailwindcss/postcss
```

The Whisk-specific code is in `src/app/checkout.tsx` and the brand
tokens are in `src/app/globals.css`. Lift those, update your
`package.json`, and the recipe runs the same way.
