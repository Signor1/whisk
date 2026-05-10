<img src="./logo.png" alt="Whisk Logo" width="200" />

# Whisk

**Embeddable USDC send & bridge widget, built on Circle App Kit.**

Drop-in React component. Same interface for same-chain sends and cross-chain bridges. Multi-chain. Pluggable recipient resolution. MIT-licensed.

[![npm @strimz/whisk-react](https://img.shields.io/npm/v/@strimz/whisk-react?label=%40strimz%2Fwhisk-react&style=flat-square&color=10b981)](https://www.npmjs.com/package/@strimz/whisk-react)
[![npm @strimz/whisk-core](https://img.shields.io/npm/v/@strimz/whisk-core?label=%40strimz%2Fwhisk-core&style=flat-square&color=059669)](https://www.npmjs.com/package/@strimz/whisk-core)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/Signor1/whisk/ci.yml?branch=main&style=flat-square&label=CI)](https://github.com/Signor1/whisk/actions/workflows/ci.yml)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@strimz/whisk-react?style=flat-square&label=bundle)](https://bundlephobia.com/package/@strimz/whisk-react)
[![Types](https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Built with Circle App Kit](https://img.shields.io/badge/built%20on-Circle%20App%20Kit-0052FF?style=flat-square)](https://docs.arc.network/app-kit)

---

## What is Whisk?

Whisk is the embeddable USDC widget you wish came with Circle App Kit. Drop a single React component into your app, configure a few chains, and your users can:

- **Send** USDC to any address on the same chain
- **Bridge** USDC across chains (Arc Testnet, Base, Ethereum, Solana, and more)
- Pay through **any wallet** (MetaMask, Phantom, WalletConnect, Rabby, Circle Wallets)
- See a **transparent fee breakdown** before confirming
- Watch the transfer progress through every step (`approve` → `burn` → `attestation` → `mint`)

Whisk wraps Circle's [App Kit](https://docs.arc.network/app-kit) so you don't have to think about CCTP, Gateway, attestations, or chain-specific quirks. One method for sends. One method for bridges. Same interface, same UX.

```tsx
<WhiskSend
  chains={["Arc_Testnet", "Base_Sepolia", "Solana_Devnet"]}
  defaultDestinationChain="Arc_Testnet"
  onSuccess={(r) => console.log("done:", r.finalTxHash)}
/>
```

That's it. The widget handles wallet connection, chain switching, recipient validation, fee preview, and the whole transaction lifecycle.

---

## Why Whisk?

Circle App Kit gives you the SDK. The remaining 80% is still on you:

- Designing the UI for a multi-step bridge state machine
- Wiring up wallet connection across EVM **and** Solana
- Validating addresses per-chain (EVM hex vs Solana base58)
- Surfacing fees transparently (CCTP, Gateway, custom, gas, forwarder)
- Showing per-step progress (`approve` → `burn` → `attestation` → `mint`)
- Handling retries on bridge failures
- Building a recipient-resolution layer (paste address, ENS, email, phone…)

That's the work Whisk does once, well, and ships as a widget so you can spend your time on the rest of your product.

---

## Quickstart

### Install

```bash
# pnpm
pnpm add @strimz/whisk-react

# npm
npm install @strimz/whisk-react

# yarn
yarn add @strimz/whisk-react
```

### Drop it in

```tsx
import {
  WhiskProvider,
  WhiskSend,
  createWhiskConfig,
  evm,
} from "@strimz/whisk-react";
import "@strimz/whisk-react/styles.css";

const config = createWhiskConfig({
  wallets: [evm({ projectId: process.env.WALLETCONNECT_PROJECT_ID! })],
  chains: ["Arc_Testnet", "Base_Sepolia", "Ethereum_Sepolia"],
  defaultDestinationChain: "Arc_Testnet",
});

export default function App() {
  return (
    <WhiskProvider config={config}>
      <WhiskSend />
    </WhiskProvider>
  );
}
```

That's the entire integration.

### Add Solana support

Just add the `solana()` adapter. Tree-shakeable — Solana code only enters your bundle when imported.

```tsx
import { evm, solana } from "@strimz/whisk-react";

const config = createWhiskConfig({
  wallets: [evm(), solana()],
  chains: ["Arc_Testnet", "Solana_Devnet"],
});
```

### Custom theme via CSS variables

```css
[data-whisk] {
  --whisk-primary: 142 71% 45%;
  --whisk-radius: 0.75rem;
  --whisk-font: "Inter", system-ui, sans-serif;
}
```

### Custom theme via Tailwind preset (optional)

```js
// tailwind.config.js
import { whiskTheme } from "@strimz/whisk-react/tailwind";

export default {
  presets: [whiskTheme()],
  // ...
};
```

---

## Features

| Capability               | Notes                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| **Send (same-chain)**    | Direct ERC-20 / SPL transfer. EOA or SCA on EVM; EOA on Solana.           |
| **Bridge (cross-chain)** | CCTP under the hood. Approve → burn → attestation → mint, all automatic.  |
| **Smart routing**        | Whisk picks `send` vs `bridge` from the source/destination chains.        |
| **Multi-chain**          | 18 chains in v1. Arc, Solana, Base, Ethereum, Polygon, Avalanche, more.   |
| **Multi-wallet**         | MetaMask, Phantom, WalletConnect, Rabby, Coinbase Wallet, Circle Wallets. |
| **Recipient resolvers**  | Address, ENS, or your own (email, phone, handle).                         |
| **Fee transparency**     | Custom + protocol + gas + forwarder, displayed before confirm.            |
| **Progress streaming**   | Live step state from App Kit's bridge events.                             |
| **Retry**                | Resume a failed bridge from where it broke.                               |
| **Headless mode**        | `useWhisk()` hook for full UI control.                                    |
| **Theming**              | CSS variables + optional Tailwind preset.                                 |
| **Open source**          | MIT. Read every line, fork it, ship your own.                             |

---

## Architecture

Whisk is a small monorepo. Each package has one job.

```
whisk/
├── packages/
│   ├── core/            # @strimz/whisk-core — framework-agnostic engine
│   └── react/           # @strimz/whisk-react — components, hooks, provider
├── examples/
│   └── nextjs-basic/    # Drop-in showcase app
└── apps/
    └── docs/            # Live documentation site
```

### `@strimz/whisk-core`

The engine. Pure logic. No React, no DOM, no wallet.

```
core/src/
├── types/         # Public TypeScript types (Chain, Quote, Step, Resolver, …)
├── errors/        # WhiskError + 9 typed subclasses + toWhiskError() coercer
├── chains/        # Single registry of every supported chain (one entry per chain)
├── resolvers/     # addressResolver + composeResolvers() — extension point
├── routing/       # decideRoute(source, dest) → 'send' | 'bridge'
├── fees/          # buildCustomFeeEntries (90/10 split) + sumFees + fromAppKitFees
├── state/         # Pure reducer + WhiskAction discriminated union
└── engine/        # createWhisk(config) → WhiskEngine (resolve / quote / send / retry)
```

The engine is **stateless** — `createWhisk()` returns an interface with four methods. State machine lives in the consumer (`useReducer` in React, signal store in Solid, etc.). This is what lets us add Vue/Solid/vanilla layers later without rewriting core.

### `@strimz/whisk-react`

The default frontend. Three composition surfaces:

```tsx
// 1. Drop-in (most opinionated)
<WhiskSend chains={[...]} />

// 2. Modal
<WhiskSendModal trigger={<button>Send USDC</button>} />

// 3. Headless (full UI control)
const { state, send, connect } = useWhisk();
```

All three render off the same engine + state machine. Devs pick by ergonomic preference, not capability.

### Engine ↔ App Kit boundary

Whisk does not introspect App Kit's wallet adapter. The React layer constructs the right App Kit adapter (Viem, Solana Kit, Circle Wallets) and passes it to the engine as a typed `WhiskAdapter`:

```ts
type WhiskAdapter = {
  appKitAdapter: AdapterContext["adapter"]; // App Kit's typed Adapter
  kind: "evm" | "solana"; // for capability checks
  address: string; // signer address
};
```

The engine forwards to App Kit's `kit.send()` / `kit.bridge()`, subscribes to `bridge.*` lifecycle events, and translates the result into Whisk's normalised `Step` shape. No `as any` casts — every App Kit type is properly bound.

### Smart routing

```ts
function decideRoute(source: Chain, destination: Chain): Route {
  return source === destination
    ? { kind: "send", chain: source }
    : { kind: "bridge", sourceChain: source, destinationChain: destination };
}
```

The engine always calls this rather than letting consumers hard-code the comparison. The widget UI never asks "send or bridge?" — it asks "from where, to where?" and routes itself.

### Recipient resolution

The single extension point that lets host apps support email / phone / handle / ENS / anything else without forking the widget.

```ts
type Resolver = {
  name: string;
  matches: (input: string) => boolean;
  resolve: (input: string, ctx: ResolverContext) => Promise<ResolvedRecipient | null>;
};

const resolver = composeResolvers([
  addressResolver, // 0x… and base58 — built in
  ensResolver({ rpcUrl }), // *.eth — built in (Mainnet only)
  myEmailResolver, // your custom
]);
```

`composeResolvers` runs each child in order; first non-null match wins. Errors wrap as `ResolverError` with the failing resolver's name attached so debugging is precise.

### State machine

Whisk's UI renders off a single discriminated-union state. Every transition is explicit and deterministic.

```
disconnected
    ↓ connect()
   idle → resolving → resolved → quoting → review → sending → succeeded
                                                       ↓
                                                     failed → (retry)
```

The reducer is in `core/src/state/machine.ts` — pure, testable, one transition per case.

### Fee transparency

```
Recipient gets:        1.00 USDC
─────────────────────────────────────────
Transfer amount:       1.00 USDC
Custom fee:           +0.20 USDC
  → Host (90%):        0.18 USDC
  → Arc share (10%):   0.02 USDC
CCTP protocol fee:     0.05 USDC
Estimated gas:         0.012 USDC
─────────────────────────────────────────
You pay:               1.262 USDC
```

The 10% Arc share is a Circle App Kit policy — Whisk surfaces it openly rather than burying it. Devs configure their fee policy once at provider time:

```tsx
createWhiskConfig({
  feePolicy: {
    value: "0.20", // 0.20 USDC on every transfer
    recipient: "0xYourTreasury",
  },
});
```

### Errors

Every failure is a `WhiskError` instance with a stable `code` and a `retryable: boolean` flag. UIs branch on the type or the boolean.

```ts
try {
  await engine.send(params);
} catch (err) {
  if (err instanceof WrongChainError) {
    /* show "switch network" */
  } else if (err instanceof InsufficientBalanceError) {
    /* show top-up CTA */
  } else if (err.retryable) {
    /* show retry button */
  }
}
```

Subclasses: `NoAdapterError`, `WrongChainError`, `InsufficientBalanceError`, `InvalidAddressError`, `ResolverError`, `BridgeStepError`, `UserRejectedError`, `NetworkError`, `ConfigError`. `toWhiskError(err)` coerces an unknown thrown value into the right class — used by every catch block in the engine.

---

## Supported chains

| Network              | Chain ID                | Send | Bridge | Account types   |
| -------------------- | ----------------------- | :--: | :----: | --------------- |
| Arc Testnet          | `Arc_Testnet`           |  ✅  |   ✅   | EOA, SCA        |
| Solana Devnet        | `Solana_Devnet`         |  ✅  |   ✅   | EOA             |
| Ethereum Sepolia     | `Ethereum_Sepolia`      |  ✅  |   ✅   | EOA, SCA        |
| Base Sepolia         | `Base_Sepolia`          |  ✅  |   ✅   | EOA, SCA        |
| Arbitrum Sepolia     | `Arbitrum_Sepolia`      |  ✅  |   ✅   | EOA, SCA        |
| Optimism Sepolia     | `Optimism_Sepolia`      |  ✅  |   ✅   | EOA, SCA        |
| Polygon Amoy         | `Polygon_Amoy_Testnet`  |  ✅  |   ✅   | EOA, SCA        |
| Avalanche Fuji       | `Avalanche_Fuji`        |  ✅  |   ✅   | EOA, SCA        |
| Monad Testnet        | `Monad_Testnet`         |  ✅  |   ✅   | EOA, SCA        |
| Unichain Sepolia     | `Unichain_Sepolia`      |  ✅  |   ✅   | EOA, SCA        |
| Mainnet equivalents  | (same names, no suffix) |  ✅  |   ✅   | varies          |

Adding a chain = a single new entry in `packages/core/src/chains/registry.ts`.

---

## Theming

Whisk ships with a default theme driven by CSS variables. Override any of them in your own stylesheet:

```css
:root {
  /* colour */
  --whisk-bg: 0 0% 100%;
  --whisk-fg: 240 10% 3.9%;
  --whisk-primary: 142 71% 45%;
  --whisk-primary-fg: 0 0% 100%;
  --whisk-muted: 240 4.8% 95.9%;
  --whisk-border: 240 5.9% 90%;
  --whisk-destructive: 0 84.2% 60.2%;

  /* shape */
  --whisk-radius: 0.5rem;

  /* type */
  --whisk-font: ui-sans-serif, system-ui, sans-serif;
}

[data-whisk].dark {
  --whisk-bg: 240 10% 3.9%;
  --whisk-fg: 0 0% 98%;
  /* … */
}
```

Tailwind users can opt into the preset for first-class token mapping:

```js
// tailwind.config.js
import { whiskTheme } from "@strimz/whisk-react/tailwind";

export default {
  presets: [whiskTheme()],
};
```

---

## Security model

- **No private keys ever touch Whisk.** The widget is browser-side; signing happens in the user's wallet. Whisk is a UI shell over App Kit's adapters.
- **No telemetry.** Nothing phones home.
- **Open source under MIT.** Audit every line. Fork it. Ship your own.
- **Type-safe end to end.** Engine is fully bound to App Kit's exported types. No `any` casts in the source.
- **Branch protection.** `main` is protected; every change goes through PR review including changes from the maintainer.
- **CodeQL on every PR.** Static analysis catches injection, XSS, prototype pollution, weak crypto, hardcoded credentials, etc.
- **Dependabot** keeps dependencies fresh; major bumps of load-bearing deps (Next, React, Circle App Kit) are gated for human review.

---

## Status

| Module                       | Status        |
| ---------------------------- | ------------- |
| `@strimz/whisk-core`      | ✅ ready (v0.0.1) |
| `@strimz/whisk-react`     | 🚧 in progress |
| Default theme + components   | 🚧 in progress |
| Next.js example              | ⏳ planned    |
| Documentation site           | ⏳ planned    |
| Email / phone resolvers      | ⏳ v0.2       |
| Vue / Solid / vanilla bundles| ⏳ v1         |
| Swap + Unified Balance       | ⏳ v2         |

This is pre-1.0 software. APIs may shift before v1. Watch the repo for releases.

---

## Contributing

Whisk is community-maintained. Anyone can:

- File a bug or feature request → [open an issue](https://github.com/Signor1/whisk/issues)
- Improve the code → fork the repo, branch off `main`, open a pull request
- Improve the docs → same flow; small docs PRs are very welcome

Read [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, project layout, PR conventions, and the security-disclosure flow. The `main` branch is protected — every change lands via PR review, including changes from the maintainer.

### Local development

```bash
git clone https://github.com/Signor1/whisk.git
cd whisk
pnpm install
pnpm -r build       # build all packages
pnpm -r typecheck   # strict type-check all packages
pnpm -r test        # run all package tests
```

---

## Acknowledgements

- Built on [Circle App Kit](https://docs.arc.network/app-kit) — the SDK doing the heavy lifting underneath.
- Inspired by [Uniswap Widgets](https://github.com/Uniswap/widgets), [shadcn/ui](https://ui.shadcn.com/) for the theming approach, and [wagmi](https://wagmi.sh/) for the config-driven adapter pattern.
- Not affiliated with Circle in any official sense — Whisk is a community widget over Circle's public SDK.

---

## License

[MIT](LICENSE) · Built by [SignorDev](https://github.com/Signor1)
