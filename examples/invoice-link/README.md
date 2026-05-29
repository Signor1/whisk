# whisk-example-invoice-link

> **Live demo:** https://whisk-invoice-link.vercel.app/ (testnet)

**Studio Hibiscus** — an invoice-link flow with two views:

- `/` (customer view) — reads `?to=…&amount=…&chain=…&memo=…` from the
  URL and renders a polished invoice (line item, totals, paid stamp on
  success).
- `/create` (merchant view) — a composer that builds the shareable URL,
  with copy + preview actions.

The whole integration is a URL. No SDK on the customer's side.

## What this recipe shows

- All four `<WhiskSend>` props (`amount`, `recipient`, `sourceChain`,
  `destinationChain`) hydrated from query params on the customer view.
- Empty-state fallback with three demo invoices if the URL has no
  params.
- Animated "Paid" stamp via CSS keyframes when `onSuccess` fires.
- Composer form on `/create` with validation, live preview of the URL,
  and copy-to-clipboard.
- Coral/sage palette (distinct from the Atelier Hibiscus ecommerce
  recipe — same "Hibiscus" mood, different studio).
- Runs `feeBearer: "sender"` so the payer covers the bridge fees and the
  freelancer receives the exact invoiced amount.

## Stack

- **Next.js 15** App Router
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **@usewhisk/react** for the `<WhiskSend>` widget

## Run

```bash
pnpm install
cp .env.example .env.local  # optional: paste a WalletConnect project ID
pnpm --filter @usewhisk/example-invoice-link dev
```

Open <http://localhost:3030>. Try one of the demo links on the empty
state, or go straight to `/create` to compose one.
`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is optional — without it
MetaMask / Rabby / Coinbase Wallet still work, you just won't see the
WalletConnect QR option.

## Adapt for your project

```bash
pnpm add @usewhisk/react @usewhisk/core
pnpm add -D tailwindcss @tailwindcss/postcss
```

Customer view in `src/app/invoice.tsx`, composer in
`src/app/create/form.tsx`, brand tokens in `src/app/globals.css`.
