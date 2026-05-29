---
"@usewhisk/core": minor
"@usewhisk/react": minor
---

Fee bearer control and a stale-quote fix.

**`feeBearer`** — new config option. Default `"receiver"` preserves current behavior (CCTP + Forwarder fees come out of the transfer). Set `feeBearer: "sender"` to size the burn up by the estimated fees so the recipient receives the full amount — useful for checkout, payroll, and invoice flows. Quotes now expose `amountBurned` (the on-chain transfer amount) alongside `amountIn` (sender debit) and `amountOut` (recipient receives). In sender mode the gross-up pads the forwarding portion by a small margin (2%); the forwarder fee is re-priced from destination gas at mint time, so the cushion keeps the recipient at or above the requested amount despite drift, with any unused margin minted to them.

**Fix** — changing the destination chain after the recipient resolved kept quoting against the original chain. A host-pinned recipient was resolved only once (a one-shot `useRef` latch) and the "Review" gate ignored the chain, so switching destinations reused the stale resolution and bridged to the wrong chain. Auto-resolve is now keyed on recipient + destination, and a resolved recipient whose chain no longer matches the selected destination is re-resolved before quoting.

**Fix** — host theme overrides were ignored in dark mode. The widget's dark palette lived on `[data-whisk][data-whisk-theme="dark"]` (specificity 0,2,0), which out-specified a host re-theming `--whisk-*` on `[data-whisk]` (0,1,0) — so a dark integration kept the default wine/terracotta colors. The theme discriminators are now wrapped in `:where()`, keeping every theme block at `[data-whisk]` specificity, so host overrides win in light, dark, and system (on the card and in portals).

**Fix** — wallet errors surfaced the raw viem/App Kit dump (`Request Arguments: …`, `Version: viem@…`). Declining the wallet prompt now reads "You cancelled the transaction in your wallet.", and other errors are trimmed to their human first line (App Kit's "Unknown blockchain error on \<chain\>:" wrapper and the argument dump are stripped). The full provider error is preserved on `cause` for debugging. This cleanup now covers every surface that renders an error — the transfer result screen, the connect modal (EVM and Solana), the manual-mint flow, and the ENS resolver — not just the bridge path. The message cleaner is also exported as `cleanErrorMessage` for custom surfaces.
