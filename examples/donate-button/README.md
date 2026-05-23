# whisk-example-donate-button

Vite + React donation page. The recipient is pinned (it's the project's
treasury); the donor picks the chain and the amount.

## What's interesting

- **Vite, not Next.js** — the wallet stack runs entirely client-side, so
  there's no SSR coordination. `vite.config.ts` aliases two of wagmi's
  Node-only transitive deps (`@react-native-async-storage/async-storage`
  and `pino-pretty`) to an empty stub so the dev bundle resolves.
- Only `recipient` is locked. `defaultAmount` is set when the donor
  taps a $5 / $25 / $100 chip — uncontrolled, so they can still type
  whatever they want.
- Multi-chain donor flow: Arc Testnet, Base Sepolia, Ethereum Sepolia.

## Run

```bash
pnpm install
pnpm --filter @usewhisk/example-donate-button dev
```

Open <http://localhost:3011>.
