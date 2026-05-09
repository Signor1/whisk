# whisk-example-payroll-batch

Vite + React admin tool. A list of payees on the left, a single
`<WhiskSend>` instance on the right that re-renders with the active
payee's address + amount as you click rows.

## What's interesting

- One widget instance, many payees. Clicking a row swaps the
  controlled `recipient` and `amount` props; the widget rebuilds its
  internal state for that payee.
- Payee list tracks per-row payment status locally. In a real app
  this is webhook-driven server state, not local React state.
- All rows lock to a single chain (`Arc_Testnet`) — typical for an
  internal payroll tool where the treasury already lives on one chain.

## Run

```bash
pnpm install
pnpm --filter @strimz/whisk-example-payroll-batch dev
```

Open <http://localhost:3013>.
