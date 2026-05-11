# whisk-example-invoice-link

The whole integration is a URL. The merchant generates a link, the
customer clicks it, Whisk reads the params and pre-fills the widget.
No SDK on the merchant's site, no JS coordination — just a hyperlink.

## Param schema

```
/?to=0x…&amount=49.99&chain=Arc_Testnet&memo=Invoice+%23420
```

| Param    | Required | Notes                                                |
|----------|----------|------------------------------------------------------|
| `to`     | yes      | Recipient EVM address (0x… 40 hex)                   |
| `amount` | yes      | USDC amount as a string (e.g. `49.99`)               |
| `chain`  | yes      | Whisk chain literal (`Arc_Testnet`, `Base_Sepolia`, …) |
| `memo`   | no       | Free-text shown in the invoice header                |

## What's interesting

- Validates `chain` against the registry — bogus values fall through
  to a "share a link" fallback page with sample URLs.
- All controlled props pinned, so the customer can't change anything.
  This is critical for invoice-link UX: the merchant is the source of
  truth.
- `Suspense` boundary around `useSearchParams()` is required by Next.js
  15 — `client-gate.tsx` handles it.

## Run

```bash
pnpm install
pnpm --filter @signordev/whisk-example-invoice-link dev
```

Open <http://localhost:3014/?to=0x5B8ecaB7096F8aBED873D246629ef9f05f467605&amount=49.99&chain=Arc_Testnet&memo=Invoice+%23420>.
