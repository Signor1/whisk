# @usewhisk/react

[![npm version](https://img.shields.io/npm/v/@usewhisk/react?style=flat-square&color=10b981)](https://www.npmjs.com/package/@usewhisk/react)
[![types](https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](./LICENSE)

Drop-in React widget for sending and bridging USDC. One component
handles wallet connect, recipient resolution, fee preview, and the
full transaction lifecycle. Built on
[Circle App Kit](https://docs.arc.network/app-kit), powered by
[`@usewhisk/core`](https://www.npmjs.com/package/@usewhisk/core).

```tsx
<WhiskProvider config={config}>
  <WhiskSend />
</WhiskProvider>
```

> **Status:** Live on testnets today. Mainnet support is in progress.
> The API doesn't change between testnet and mainnet — only the chain
> identifiers you pass to `createWhiskConfig`.

## Install

```bash
pnpm add @usewhisk/react @usewhisk/core
```

(`npm install`, `yarn add`, and `bun add` work the same way.)

### Peer dependencies

| Peer | Range |
|---|---|
| `react` | `>=18` |
| `react-dom` | `>=18` |
| `@tanstack/react-query` | `>=5` |

`wagmi`, `viem`, `@solana/wallet-adapter-react`, and `@solana/web3.js`
ship as direct dependencies, so you don't need to install them
separately. If you already use wagmi in your app, Whisk reuses an
outer `<WagmiProvider>` automatically — no double-mount.

## Quickstart

```tsx
"use client";

import {
  WhiskProvider,
  WhiskSend,
  createWhiskConfig,
  evm,
  solana,
} from "@usewhisk/react";
import "@usewhisk/react/styles.css";

const config = createWhiskConfig({
  wallets: [
    evm({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
      appName: "My App",
    }),
    solana(), // omit this entry entirely if you don't want Solana
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
        onSuccess={({ finalTxHash }) =>
          console.log("paid:", finalTxHash)
        }
      />
    </WhiskProvider>
  );
}
```

Same-chain sends and CCTP v2 cross-chain bridges share a single UI
flow: connect → input → review → progress. The widget switches
between modes automatically based on source and destination chain.

## Surface

### Components

| Export | What it is |
|---|---|
| `<WhiskProvider>` | Provider stack — wagmi + react-query + (optional) Solana adapters + Whisk context. Detects and reuses an outer `<WagmiProvider>` / `<QueryClientProvider>`. |
| `<WhiskSend>` | The full inline widget — transfer and (optional) swap tabs. |
| `<SwapTab>` | The swap surface as a standalone component. Useful when you want a trade-only flow without the transfer UI. |
| `<ConnectModal>` | The wallet picker on its own. Reach for it when you want to launch connection outside the widget. |
| `<AccountChip>` / `<NetworkPill>` | Header-friendly status elements you can drop anywhere in your app shell. |

### Hooks

```ts
import {
  useWhisk,           // engine state + actions
  useWhiskAccount,    // connected address, chain, connector name
  useWhiskSwap,       // swap state machine
  useWhiskAdapter,    // builds a WhiskAdapter for the active wallet
  useWhiskContext,    // raw provider context (config, engine, theme)
  useChainBalance,    // poll a token balance on any supported chain
} from "@usewhisk/react";
```

`useWhisk()` returns `{ state, actions, connected, address }`. The
state machine surfaces every transition (`idle`, `resolving`,
`quoting`, `reviewing`, `sending`, `success`, `failed`) so you can
build telemetry, custom UI, or background flows on the same engine.

### `<WhiskSend>` props

The widget supports both **controlled** and **default** patterns. Any
prop you pass directly is treated as the source of truth — the
corresponding field becomes read-only in the UI. `default*` variants
prefill the field but leave it editable.

```tsx
<WhiskSend
  // Controlled (locks the field):
  amount="49.99"
  recipient="alice.eth"
  sourceChain="Arc_Testnet"
  destinationChain="Base_Sepolia"

  // Or prefill but leave editable:
  defaultAmount="49.99"
  defaultRecipient="alice.eth"

  // Change handlers (controlled mode):
  onAmountChange={(v) => setAmount(v)}
  onRecipientChange={(v) => setRecipient(v)}

  // Lifecycle:
  onSuccess={({ quote, finalTxHash }) => …}
  onError={(error) => …}
  onStateChange={(state) => …}

  // Swap tab (optional — requires Circle Console kit key):
  kitKey={process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY}
  tabs={["transfer", "swap"]}
  defaultTab="transfer"
/>
```

When recipient + amount + chains are all controlled, the widget
short-circuits to a confirm-only surface — useful for invoice,
subscription, or one-product checkout flows.

### Headless entry

If you don't want any of the bundled UI, import from the
`/headless` subpath:

```ts
import {
  WhiskProvider,
  createWhiskConfig,
  evm,
  useWhisk,
  useWhiskAccount,
} from "@usewhisk/react/headless";
```

No CSS, no components — just the provider, the config helpers, and
the engine hooks. Same engine, your UI.

## Theming

Every visual property routes through a CSS variable scoped to
`[data-whisk]`. Override the tokens you care about in your own
stylesheet:

```css
[data-whisk] {
  --whisk-bg: #fbf6ee;
  --whisk-fg: #221d1a;
  --whisk-primary: #b04f3e;
  --whisk-radius-md: 0.625rem;
  /* … */
}
```

No Tailwind plugin, no CSS-in-JS runtime. Dark mode tracks
`@media (prefers-color-scheme: dark)` by default; pin it explicitly
on the provider:

```tsx
<WhiskProvider config={config} theme="light" />     // or "dark" / "system"
```

A Tailwind preset is also available:

```ts
// tailwind.config.ts
import whiskPreset from "@usewhisk/react/tailwind";

export default {
  presets: [whiskPreset],
  content: ["./node_modules/@usewhisk/react/dist/**/*.{js,cjs}"],
};
```

## SSR / Next.js App Router

Theme resolution is CSS-only — no `window.matchMedia` call, no
hydration flash. For the widget itself, load it client-side via
`next/dynamic` so wagmi and wallet-adapter don't try to initialise
during prerender:

```tsx
"use client";
import dynamic from "next/dynamic";

const WhiskSend = dynamic(
  () => import("@usewhisk/react").then((m) => m.WhiskSend),
  { ssr: false },
);
```

See the [`playground` example](https://github.com/Signor1/whisk/tree/main/examples/playground)
for a complete setup, including `next.config.ts` webpack fallbacks
for transitive Node-only deps.

## BYO wagmi / QueryClient

Already running wagmi or react-query in your app? Drop
`<WhiskProvider>` anywhere inside your existing tree and it reuses
them:

```tsx
<QueryClientProvider client={myClient}>
  <WagmiProvider config={myWagmi}>
    <WhiskProvider
      config={createWhiskConfig({
        wallets: [],        // no evm() needed — outer wagmi covers it
        chains: ["Arbitrum"],
      })}
    >
      <WhiskSend />
    </WhiskProvider>
  </WagmiProvider>
</QueryClientProvider>
```

## Solana

```ts
solana({
  network: "devnet",                       // or "mainnet-beta"
  endpoint: "https://my.helius.rpc/...",   // optional; public default otherwise
  autoConnect: false,                      // default
});
```

Phantom, Solflare, Backpack, and every Wallet-Standard wallet are
auto-discovered. There's no adapter list to maintain.

## Subpath exports

| Import path | What you get |
|---|---|
| `@usewhisk/react` | Full surface — components, hooks, config helpers. |
| `@usewhisk/react/headless` | Provider + config + engine hooks. No UI. |
| `@usewhisk/react/styles.css` | The default theme. Required for the bundled components. |
| `@usewhisk/react/tailwind` | Tailwind preset that maps `--whisk-*` to utility classes. |
| `@usewhisk/react/fonts.css` | Optional Inter font face — opt in when your app doesn't already load Inter. |

## Docs and examples

- **Full docs:** <https://www.usewhisk.xyz/docs>
- **Live playground:** <https://whisk-playground.vercel.app>
- **Examples in the repo:** [`examples/`](https://github.com/Signor1/whisk/tree/main/examples)
  (e-commerce checkout, donate button, themed SaaS, payroll batch,
  invoice link, Next.js basic)

## License

MIT © [SignorDev](https://github.com/Signor1). Source on
[GitHub](https://github.com/Signor1/whisk). Issues and PRs welcome.
