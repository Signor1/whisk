# whisk-example-donate-button

**OpenForest** — a reforestation NGO landing page with a public donor
wall, annual-goal progress bar, three donation tiers (Seedling, Grove,
Canopy), custom-amount fallback, and an active-projects showcase.

A real non-profit feel built on Tailwind CSS v4, demonstrating Whisk
with a locked recipient + soft-prefilled amount per tier.

## What this recipe shows

- Hero with live progress toward a 250,000-tree annual goal.
- Three tier buttons that pass controlled `amount` (locks the field) per
  tier — each maps to a concrete impact (1, 6, or 30 trees).
- A "custom" toggle that switches the widget to uncontrolled — donor
  picks their own amount.
- **Cross-ecosystem sources via CCTP** — donors connect with Phantom
  (Solana Devnet) *or* MetaMask / Coinbase / WalletConnect (Arc Testnet,
  Base Sepolia, Ethereum Sepolia). Treasury is EVM-format, so
  `destinationChain` is pinned to Arc Testnet on the widget.
- `recipient` is pinned to the OpenForest treasury — never editable.
- Public donor wall, impact stats, and an active-projects grid with
  per-project progress.
- `onSuccess` shows a tier-specific thank-you with a tx hash link.
- Runs `feeBearer: "sender"` so the donor covers the bridge fees and the
  treasury receives the full tier amount ($25 lands as $25).

## Stack

- **Vite + React 19** (no SSR, fast iteration)
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **@usewhisk/react** for the `<WhiskSend>` widget

## Run

```bash
pnpm install
cp .env.example .env.local  # optional: paste a WalletConnect project ID
pnpm --filter @usewhisk/example-donate-button dev
```

Open <http://localhost:5173>. `VITE_WALLETCONNECT_PROJECT_ID` is
optional — without it MetaMask / Rabby / Coinbase Wallet still work, you
just won't see the WalletConnect QR option.

## Adapt for your project

```bash
pnpm add @usewhisk/react @usewhisk/core
pnpm add -D tailwindcss @tailwindcss/vite
```

The Whisk-specific code is in `src/App.tsx` and brand tokens are in
`src/styles.css`. Drop them into your project and you're set.
