# @strimz/whisk-react

Drop-in React widget for sending and bridging USDC. Powered by
[Circle App Kit](https://developers.circle.com/w3s/docs/app-kit) and
[`@strimz/whisk-core`](../core).

```tsx
<WhiskProvider config={config}>
  <WhiskSend />
</WhiskProvider>
```

That's it. The widget handles wallet connection, recipient resolution,
quoting, the review step, and a step-by-step progress view. Same-chain
sends and CCTP v2 cross-chain bridges share one UI.

## Install

```bash
pnpm add @strimz/whisk-react @strimz/whisk-core
```

Peer requirements (the EVM stack is mandatory; Solana is opt-in):

- `react ^18 || ^19`
- `wagmi ^2`
- `viem ^2`
- `@tanstack/react-query ^5`
- `@solana/wallet-adapter-react ^0.15`, `@solana/web3.js ^1` — only if
  you call `solana()` in your config

## Quickstart

```tsx
"use client";

import {
  WhiskProvider,
  WhiskSend,
  createWhiskConfig,
  evm,
  solana,
} from "@strimz/whisk-react";
import "@strimz/whisk-react/styles.css";

const config = createWhiskConfig({
  wallets: [
    evm({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
      appName: "My App",
    }),
    solana(), // omit this entirely if you don't want Solana
  ],
  chains: ["Arc_Testnet", "Base_Sepolia", "Solana_Devnet"],
  defaultSourceChain: "Arc_Testnet",
  defaultDestinationChain: "Arc_Testnet",
  appLabel: "my-app",
});

export function Checkout() {
  return (
    <WhiskProvider config={config}>
      <WhiskSend
        amount="49.99"
        recipient="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1"
        onSuccess={(quote, txHash) => console.log("paid:", txHash)}
      />
    </WhiskProvider>
  );
}
```

## What's in the box

### Components

- **`<WhiskProvider>`** — provider stack (WagmiProvider, QueryClient,
  Solana ConnectionProvider/WalletProvider when needed, WhiskContext).
  Detects an outer `<WagmiProvider>` or `<QueryClientProvider>` and
  reuses them.
- **`<WhiskSend>`** — the full widget. Connect → input → review →
  progress.
- **`<WhiskSendModal>`** — same widget in a modal shell, with a trigger.
- **`<AccountChip>` / `<NetworkPill>`** — small surface elements you
  can drop into any header.

### Headless hooks

For full control over the UI:

```tsx
import { useWhisk, useWhiskAccount } from "@strimz/whisk-react/headless";

function MyCustomFlow() {
  const { state, actions, connected } = useWhisk();
  const account = useWhiskAccount();
  // Drive your own UI off `state` and call `actions.{resolve, quote, send}`.
}
```

The headless surface has zero pre-built UI — same engine, your design.

### Controlled props

Pre-fill any field on the widget:

```tsx
<WhiskSend
  amount="10"                 // hard-coded purchase price
  recipient="alice.eth"       // payee
  sourceChain="Arc_Testnet"
  destinationChain="Base_Sepolia"
  lockChains                  // hide the chain picker entirely
/>
```

When all four are present the widget short-circuits to a single
"confirm" button — perfect for invoice or subscription checkouts.

## Theming

Tokens live in `styles.css` as CSS variables:

```css
[data-whisk] {
  --whisk-bg: #fbf6ee;
  --whisk-fg: #221d1a;
  --whisk-accent: #b04f3e;
  --whisk-radius-md: 0.625rem;
  /* … */
}
```

Override them in your own stylesheet under `[data-whisk]` — no Tailwind,
no CSS-in-JS runtime needed. Dark mode is handled with
`@media (prefers-color-scheme: dark)`; pin a mode via `theme="light" |
"dark"` on `<WhiskProvider>` if you want to override the OS preference.

A Tailwind preset is also available:

```ts
// tailwind.config.ts
import whiskPreset from "@strimz/whisk-react/tailwind";

export default {
  presets: [whiskPreset],
  content: ["./node_modules/@strimz/whisk-react/dist/**/*.{js,cjs}"],
};
```

## BYO wagmi / QueryClient

Whisk auto-detects an outer `<WagmiProvider>` and `<QueryClientProvider>`
and reuses them. Drop `<WhiskProvider>` anywhere inside your existing
provider tree — `evm()` becomes optional when an outer wagmi config is
already present.

```tsx
<QueryClientProvider client={myClient}>
  <WagmiProvider config={myWagmi}>
    <WhiskProvider
      config={createWhiskConfig({
        wallets: [],          // no evm() needed — outer wagmi covers it
        chains: ["Arbitrum"],
      })}
    >
      <WhiskSend />
    </WhiskProvider>
  </WagmiProvider>
</QueryClientProvider>
```

## SSR

Safe with Next.js 15 / RSC. Theme is resolved with CSS only — no
`window.matchMedia`, no flash on hydration. For wallet-related code you
still want the widget loaded client-side via `next/dynamic` so wagmi /
wallet-adapter don't try to initialise during prerender:

```tsx
"use client";
import dynamic from "next/dynamic";

const WhiskSend = dynamic(
  () => import("@strimz/whisk-react").then((m) => m.WhiskSend),
  { ssr: false },
);
```

See `examples/nextjs-basic` for a working setup including
`next.config.ts` webpack fallbacks for transitive Node-only deps
(`@react-native-async-storage/async-storage`, `pino-pretty`).

## Solana

Add `solana()` to `config.wallets` to enable Solana send + bridge:

```ts
solana({
  cluster: "devnet",          // or "mainnet-beta" / "testnet"
  endpoint: "https://my.helius.rpc/...", // optional — public default otherwise
});
```

Whisk uses `@solana/wallet-adapter-react` under the hood. Phantom,
Solflare, Backpack and any other Wallet-Standard wallet are
auto-discovered; no adapter list to maintain.

## License

MIT © SignorDev
