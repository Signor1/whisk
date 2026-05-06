# @strimz/whisk-core

Framework-agnostic engine that powers the Whisk USDC widget. Most apps
should consume [`@strimz/whisk-react`](../react) instead — reach for this
package directly only when:

- You're building a Whisk frontend in something other than React (Vue,
  Svelte, vanilla TS, a CLI).
- You need to run Whisk's logic on a server (server-rendered checkout
  flows, queue workers that pre-resolve recipients, scheduled drops).
- You're writing tests that verify the engine's behaviour without
  pulling in a wallet adapter.

`whisk-core` has no React, wagmi, or wallet-adapter dependencies. It
takes a `WhiskAdapter` you build yourself (typically by wrapping an
authenticated wallet) and exposes a small surface for resolving
recipients, quoting transfers, and running the send / bridge state
machine.

## Install

```bash
pnpm add @strimz/whisk-core
# or: npm install / yarn add
```

Peer requirement: `@circle-fin/app-kit ^1` (Whisk delegates the actual
on-chain work to App Kit).

## Quick tour

```ts
import {
  createWhisk,
  addressResolver,
  composeResolvers,
  reduce,
  initialState,
  toWhiskError,
} from "@strimz/whisk-core";

const engine = createWhisk({
  chains: ["Arc_Testnet", "Base_Sepolia", "Solana_Devnet"],
  defaultSourceChain: "Arc_Testnet",
  resolver: composeResolvers([addressResolver]),
  appLabel: "my-checkout",
});

// 1. Resolve free-text input → on-chain recipient
const recipient = await engine.resolve(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
  "Arc_Testnet",
);

// 2. Quote a transfer
const quote = await engine.quote({
  sourceChain: "Arc_Testnet",
  destinationChain: "Arc_Testnet",
  recipient,
  amount: "10",
  adapter, // your WhiskAdapter — see below
});

// 3. Send (with step-by-step progress)
const result = await engine.send(
  {
    sourceChain: quote.route.kind === "send" ? quote.route.chain : quote.route.sourceChain,
    destinationChain: recipient.chain,
    recipient,
    amount: quote.amountOut,
    adapter,
    quote,
  },
  {
    onStep: (step) => console.log(step.name, step.state),
  },
);
```

The state machine is exposed separately for UIs that want their own
reducer wiring:

```ts
import { reduce, initialState } from "@strimz/whisk-core";

let state = initialState; // { kind: "disconnected" }
state = reduce(state, { type: "CONNECTED" });          // { kind: "idle" }
state = reduce(state, { type: "RESOLVE_START", input: "alice.eth" });
// …
```

## Building a WhiskAdapter

A `WhiskAdapter` is the bridge between Whisk's engine and your wallet
layer. Wrap whatever you have — a wagmi connector, a Solana
wallet-adapter wallet, a server-side keypair — into the shape App Kit's
adapters expect, then pass it to `engine.quote` / `engine.send`.

```ts
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import type { WhiskAdapter } from "@strimz/whisk-core";

const provider = await wagmiConnector.getProvider();
const appKitAdapter = await createViemAdapterFromProvider({ provider });

const adapter: WhiskAdapter = {
  appKitAdapter,
  kind: "evm",
  address: walletAddress,
};
```

The React package does this automatically via `useWhiskAdapter`.

## Resolvers

The engine resolves free-text recipient input through a chain of
`Resolver` objects. The default chain just contains `addressResolver`
(EVM hex + Solana base58). Add ENS, email, handle resolvers by composing:

```ts
import { addressResolver, composeResolvers } from "@strimz/whisk-core";

const ensResolver = {
  name: "ens",
  matches: (input) => input.endsWith(".eth"),
  resolve: async (input) => /* … your lookup … */,
};

const resolver = composeResolvers([addressResolver, ensResolver]);
```

Children run in order; the first non-null match wins. Throws are tagged
with the resolver's name for clean debugging.

## Errors

Every failure path returns a `WhiskError` (or a subclass). Use `code` to
branch in your UI:

| Code | Meaning | Retryable |
|------|---------|-----------|
| `NO_ADAPTER` | No wallet connected | no |
| `WRONG_CHAIN` | Wallet on wrong chain | yes |
| `INSUFFICIENT_BALANCE` | Not enough USDC / gas | no |
| `INVALID_ADDRESS` | Recipient input unparseable | no |
| `RESOLVER_FAILED` | Resolver matched but failed | yes |
| `BRIDGE_STEP_FAILED` | Specific step errored | yes |
| `USER_REJECTED` | User clicked reject | yes |
| `NETWORK_ERROR` | Transient RPC issue | yes |
| `CONFIG_ERROR` | Developer mistake | no |
| `UNKNOWN` | Catch-all | no |

`toWhiskError(unknown)` wraps any thrown value into the right subclass.

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
} from "@strimz/whisk-core";

chainInfo("Arc_Testnet").label;            // "Arc Testnet"
chainsByNetwork("testnet").length;          // every supported testnet
chainByEvmId(8453)?.chain;                  // "Base"
explorerTxUrl("Solana_Devnet", "sig123");  // includes ?cluster=devnet
```

## Testing

```bash
pnpm --filter @strimz/whisk-core test
```

The suite covers the state machine, resolver chain, address resolver,
fee math, routing, error mapping, and the chain registry — 80+ tests
running in under 30 ms.

## License

MIT © SignorDev
