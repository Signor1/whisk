# @usewhisk/core

[![npm version](https://img.shields.io/npm/v/@usewhisk/core?style=flat-square&color=10b981)](https://www.npmjs.com/package/@usewhisk/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@usewhisk/core?style=flat-square&label=bundle)](https://bundlephobia.com/package/@usewhisk/core)
[![types](https://img.shields.io/badge/types-TypeScript-3178c6?style=flat-square)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](./LICENSE)

Framework-agnostic engine that powers the Whisk USDC widget. No React,
no wagmi, no wallet-adapter dependencies — just the state machine,
resolvers, chain registry, fees, and error model.

> **Most apps want [`@usewhisk/react`](https://www.npmjs.com/package/@usewhisk/react) instead.**
> Reach for `@usewhisk/core` directly when you're building a Whisk
> frontend outside React, running engine logic on a server, or writing
> tests that don't pull in a wallet adapter.

```ts
const engine = createWhisk({ chains: ["Arc_Testnet"], resolver });
const recipient = await engine.resolve("alice.eth", "Arc_Testnet");
const quote = await engine.quote({ ..., recipient, amount: "10" });
const result = await engine.send({ ..., quote, adapter });
```

> **Status:** Live on testnets today. Mainnet support is in progress.

## Install

```bash
pnpm add @usewhisk/core
```

`@circle-fin/app-kit` ships as a direct dependency. Whisk delegates
the on-chain work (transfers, CCTP bridge, attestation polling) to
App Kit and wraps that surface in something typed, composable, and
easy to test.

## Quick tour

```ts
import {
  createWhisk,
  addressResolver,
  composeResolvers,
} from "@usewhisk/core";

const engine = createWhisk({
  chains: ["Arc_Testnet", "Base_Sepolia", "Solana_Devnet"],
  defaultSourceChain: "Arc_Testnet",
  resolver: composeResolvers([addressResolver]),
  appLabel: "my-checkout",
});

// 1. Resolve free-text recipient input.
const recipient = await engine.resolve(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "Arc_Testnet",
);

// 2. Quote a transfer (same-chain or cross-chain — auto-routed).
const quote = await engine.quote({
  sourceChain: "Arc_Testnet",
  destinationChain: "Arc_Testnet",
  recipient,
  amount: "10",
  adapter, // see "Building a WhiskAdapter" below
});

// 3. Send, with per-step progress callbacks.
const result = await engine.send(
  { ...quote.input, adapter, quote },
  { onStep: (step) => console.log(step.name, step.state) },
);

if (result.kind === "success") {
  console.log("final tx:", result.finalTxHash);
} else {
  console.error(result.error.code, result.error.message);
}
```

The state machine is exported separately for UIs that want their own
reducer wiring:

```ts
import { reduce, initialState, type WhiskAction } from "@usewhisk/core";

let state = initialState; // { kind: "disconnected" }
state = reduce(state, { type: "CONNECTED" });
state = reduce(state, { type: "RESOLVE_START", input: "alice.eth" });
// ...
```

## Engine surface

`createWhisk(config)` returns a `WhiskEngine`:

```ts
interface WhiskEngine {
  readonly config: WhiskConfig;
  resolve(input: string, chain: Chain): Promise<ResolvedRecipient>;
  quote(params: QuoteParams): Promise<Quote>;
  send(params: SendParams, listeners?: SendListeners): Promise<SendResult>;
  retry(params: RetryParams, listeners?: SendListeners): Promise<SendResult>;
  estimateSwap(params: SwapParams): Promise<SwapEstimate>;
  swap(params: SwapParams): Promise<SwapResult>;
}
```

`SendResult` is a discriminated union of `SendSuccess` and
`SendFailure` — branch on `result.kind` and TypeScript narrows the
rest of the shape.

## Building a WhiskAdapter

A `WhiskAdapter` is the bridge between Whisk's engine and your wallet
layer. Wrap whatever you have (a wagmi connector, a Solana
wallet-adapter wallet, a server keypair) into the shape App Kit's
adapters expect, then pass it to `engine.quote` / `engine.send`.

```ts
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { WhiskAdapter } from "@usewhisk/core";

const provider = await wagmiConnector.getProvider();
const appKitAdapter = await createViemAdapterFromProvider({ provider });

const adapter: WhiskAdapter = {
  appKitAdapter,
  kind: "evm",
  address: walletAddress,
};
```

The React package builds this for you automatically via
`useWhiskAdapter()`.

## Resolvers

The engine resolves free-text recipient input through a chain of
`Resolver` objects. The default chain just contains
`addressResolver` (EVM hex + Solana base58). Add ENS, email, handle,
or any custom lookup by composing:

```ts
import {
  addressResolver,
  composeResolvers,
  type Resolver,
} from "@usewhisk/core";

const ensResolver: Resolver = {
  name: "ens",
  matches: (input) => input.endsWith(".eth"),
  resolve: async (input, chain) => /* your lookup */,
};

const resolver = composeResolvers([addressResolver, ensResolver]);
```

Resolvers run in order; the first non-null match wins. Throws are
tagged with the resolver's name for clean error reporting.

(`@usewhisk/react` ships an ENS resolver out of the box. The bare
core gives you the address resolver and the composition helper — wire
your own.)

## Errors

Every failure path returns a `WhiskError`, or one of its subclasses.
Branch on `code` in your UI:

| Code | Class | Retryable |
|------|-------|-----------|
| `NO_ADAPTER` | `NoAdapterError` | no |
| `WRONG_CHAIN` | `WrongChainError` | yes |
| `INSUFFICIENT_BALANCE` | `InsufficientBalanceError` | no |
| `INVALID_ADDRESS` | `InvalidAddressError` | no |
| `RESOLVER_FAILED` | `ResolverError` | yes |
| `BRIDGE_STEP_FAILED` | `BridgeStepError` | yes |
| `USER_REJECTED` | `UserRejectedError` | yes |
| `NETWORK_ERROR` | `NetworkError` | yes |
| `WALLET_CAPABILITY` | `WalletCapabilityError` | no |
| `ONCHAIN_REVERT` | `OnchainRevertError` | no |
| `CONFIG_ERROR` | `ConfigError` | no |
| `UNKNOWN` | `WhiskError` | no |

`toWhiskError(unknown)` wraps any thrown value into the right
subclass — drop it in a top-level try/catch and you always get a
typed error back.

## Chain registry

```ts
import {
  allChains,
  chainInfo,
  chainByEvmId,
  chainsByKind,
  chainsByNetwork,
  explorerTxUrl,
  explorerAddressUrl,
  supportedTokensFor,
  tokenAddressFor,
} from "@usewhisk/core";

chainInfo("Arc_Testnet").label;            // "Arc Testnet"
chainsByNetwork("testnet").length;         // every supported testnet
chainByEvmId(8453)?.chain;                 // "Base"
explorerTxUrl("Solana_Devnet", "sig123");  // includes ?cluster=devnet
```

## Type-safe everywhere

Every chain, token, and event payload is a real TypeScript union.
Typos fail the build, not the user:

```ts
import type { Chain, Token } from "@usewhisk/core";

const chain: Chain = "Arc_Testnet"; // ✓
const token: Token = "USDC";        // ✓

const bad: Chain = "Mainnet";
//                   ^^^^^^^^^
// Type '"Mainnet"' is not assignable to type 'Chain'.
```

## Subpath exports

For tighter dead-code-elimination in apps that only touch one slice
of the surface:

| Import path | What you get |
|---|---|
| `@usewhisk/core` | Full surface — engine, resolvers, chains, errors, state machine. |
| `@usewhisk/core/types` | Just the types — `Chain`, `Quote`, `Resolver`, etc. |
| `@usewhisk/core/errors` | Just the error classes + `toWhiskError`. |
| `@usewhisk/core/resolvers` | Just `addressResolver` and `composeResolvers`. |

## Testing

```bash
pnpm --filter @usewhisk/core test
```

108 tests across 10 files — the engine, state machine, resolver
chain, address resolver, fee math, routing, error mapping, chain
registry, and recovery primitives. Runs in under 100 ms.

## Docs and examples

- **Full docs:** <https://whisk.vercel.app/docs>
- **React widget:** [`@usewhisk/react`](https://www.npmjs.com/package/@usewhisk/react)
- **Source:** <https://github.com/Signor1/whisk>

## License

MIT © [SignorDev](https://github.com/Signor1). Issues and PRs welcome.
