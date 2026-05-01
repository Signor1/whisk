# whisk-example-nextjs-basic

A 5-file showcase of `@strimz/whisk-react` running on Next.js 15.

```
src/app/
├── layout.tsx     # Self-hosts Inter + Geist Mono via next/font/google,
│                   # imports `@strimz/whisk-react/styles.css`.
├── providers.tsx  # Client boundary — createWhiskConfig + WhiskProvider.
├── page.tsx       # Server component — page chrome.
├── widget.tsx     # Client component — <WhiskSend /> with callbacks.
└── globals.css    # Page background + intro typography only.
```

## Run it

```bash
# from the repo root
pnpm install
pnpm --filter @strimz/whisk-core build       # one-time, for the workspace dep
cp examples/nextjs-basic/.env.example examples/nextjs-basic/.env.local
# (optional) paste a WalletConnect Cloud project ID into .env.local
pnpm --filter @strimz/whisk-example-nextjs-basic dev
```

Open <http://localhost:3000>. Connect MetaMask / Rabby / Coinbase Wallet
(WalletConnect appears once you set the project ID).

## What's wired in

- **Chains shown in the picker:** Arc Testnet, Base Sepolia, Ethereum
  Sepolia, Solana Devnet.
- **Solana** appears in the dropdown but the v0.1 React adapter is a
  stub — the provider warns at mount and the chain stays selectable as
  a destination via address paste. Full Solana wallet integration lands
  in v0.2.
- **WalletConnect** lights up only when you paste a project ID into
  `.env.local`; without it, MetaMask / Coinbase Wallet still work.
- **Footer wordmark** is on (`showFooter`) so you can see the opt-in
  brand surface.

## Working on Whisk and the example simultaneously

`next.config.ts` lists both Whisk packages in `transpilePackages`, so the
Next.js compiler reads them straight from source. Edit anything in
`packages/core/src/` or `packages/react/src/` and the dev server picks
it up on save — no rebuild step.

## Test transfers

The widget defaults source + destination to **Arc Testnet** so the first
transfer you do is a same-chain `send` (no CCTP attestation wait, fast
to verify). Switch the destination to Base Sepolia or Ethereum Sepolia
to exercise the bridge flow.

Need testnet USDC? <https://faucet.circle.com>.
