# whisk-example-payroll-batch

> **Live demo:** https://whisk-payroll-batch.vercel.app/ (testnet)

**Studio Fortune** — a creative agency payroll tool. Three-step flow
(review → dispatch → confirm), 6 payees on a claret/ivory editorial
palette, progress bar that animates as each transfer settles.

A real internal admin feel demonstrating Whisk dispatching payments
one-by-one through a single embedded widget.

## What this recipe shows

- Step 1 — Review: exclude any payee from the run, see the batch total
  update live.
- Step 2 — Dispatch: a progress bar + per-payee status (queued, in
  flight, settled). The Whisk widget is re-mounted between payees with
  the next payee's `amount` and `recipient` pre-filled and locked.
- Step 3 — Confirm: full run summary with every settled payee and tx.
- `onSuccess` advances to the next payee automatically — no extra clicks
  between dispatches.
- Editorial typography + serif display headers (Studio Fortune brand).
- Runs `feeBearer: "sender"` so the studio treasury covers the bridge
  fees and each contractor is paid their exact salary.

## Stack

- **Vite + React 19**
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **@usewhisk/react** for the `<WhiskSend>` widget

## Run

```bash
pnpm install
cp .env.example .env.local  # optional: paste a WalletConnect project ID
pnpm --filter @usewhisk/example-payroll-batch dev
```

Open <http://localhost:5174>. `VITE_WALLETCONNECT_PROJECT_ID` is
optional — without it MetaMask / Rabby / Coinbase Wallet still work, you
just won't see the WalletConnect QR option.

## Adapt for your project

```bash
pnpm add @usewhisk/react @usewhisk/core
pnpm add -D tailwindcss @tailwindcss/vite
```

The three-step flow lives in `src/App.tsx`; brand tokens in
`src/styles.css`.
