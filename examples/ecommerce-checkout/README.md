# whisk-example-ecommerce-checkout

Pay-with-USDC checkout. Demonstrates Whisk locked to a fixed price + a
fixed merchant address — the widget collapses into a "confirm and pay"
surface, not a transfer composer.

## What's interesting

- All four controlled props pinned: `amount`, `recipient`, `sourceChain`,
  `destinationChain`. The user can't pick chains or edit the price.
- Single-chain config (`chains: ["Arc_Testnet"]`) so the picker collapses.
- `onSuccess` flips local state to render an "Order placed" confirmation
  with the tx hash. In a real app this is where your backend would catch
  a webhook and update the order record.

## Run

```bash
pnpm install
pnpm --filter @usewhisk/example-ecommerce-checkout dev
```

Open <http://localhost:3010>.

## Adapt for your project

Inside this monorepo, the example consumes `@usewhisk/react` and
`@usewhisk/core` via `workspace:*`. When you copy this recipe into
your own app, install the published packages instead:

```bash
pnpm add @usewhisk/react @usewhisk/core
```

The Whisk-specific code lives under `src/app/`. Lift those files,
update your own `package.json` with the install above, and the recipe
runs the same way.
