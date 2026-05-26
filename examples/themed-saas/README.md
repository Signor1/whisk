# whisk-example-themed-saas

**Steelpath Cloud** — a B2B treasury dashboard with sidebar nav, KPI
cards, a scheduled-vendors table, recent settlements feed, and an
activity log. Click any vendor row to fund their next payout via Whisk.

Dark navy/teal UI demonstrating how to make `<WhiskSend>` feel native to
a serious enterprise product.

## What this recipe shows

- Dark dashboard chrome built with Tailwind CSS v4 — sidebar, top bar,
  KPI tiles, paginated lists, activity timeline.
- Vendor table with per-row click that loads `<WhiskSend>` with the
  vendor's `amount` and `recipient` pinned.
- Widget re-themed for dark mode via `[data-whisk]` CSS variable
  overrides — teal/foam primary on dark cards.
- A confirmed state after `onSuccess` with a tx hash link to the
  explorer.
- Idle state when no vendor is selected, prompting the user to pick a
  row.

## Stack

- **Next.js 15** App Router
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **@usewhisk/react** for the `<WhiskSend>` widget

## Run

```bash
pnpm install
cp .env.example .env.local  # optional: paste a WalletConnect project ID
pnpm --filter @usewhisk/example-themed-saas dev
```

Open <http://localhost:3020>. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is
optional — without it MetaMask / Rabby / Coinbase Wallet still work, you
just won't see the WalletConnect QR option.

## Adapt for your project

```bash
pnpm add @usewhisk/react @usewhisk/core
pnpm add -D tailwindcss @tailwindcss/postcss
```

The dashboard is in `src/app/dashboard.tsx`; brand tokens in
`src/app/globals.css` under `@theme`.
