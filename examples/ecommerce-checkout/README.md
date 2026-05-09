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
pnpm --filter @strimz/whisk-example-ecommerce-checkout dev
```

Open <http://localhost:3010>.
