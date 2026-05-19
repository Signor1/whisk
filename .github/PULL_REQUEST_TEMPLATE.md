<!--
Thanks for the PR. Keep this template — it saves reviewer round-trips.
Delete sections that genuinely don't apply (e.g. "Docs" on a typo fix).
-->

## What

<!-- One or two sentences. The user-visible change, not the file list. -->

## Why

<!-- The constraint that made this change necessary. Cite the issue # if there is one. -->

## How tested

<!--
- For widget UX: which playground flow, which chain pair, which wallet.
- For core changes: `pnpm test` output if it's a state-machine or routing change.
- For docs: link to the rendered page on a local `pnpm dev` if it's complex.
-->

## Docs

<!--
Did the public API change?
- [ ] No
- [ ] Yes — updated:
  - [ ] apps/docs/src/content/docs/…
  - [ ] README.md if needed
  - [ ] `pnpm changeset` recorded the user-facing change
-->

## Fund-safety checklist

<!--
Only fill in when the change touches recovery / persistence / signing /
allowance / chain-routing paths. Skip otherwise.

- [ ] No new code path leaves funds in transit without a recovery surface
- [ ] Replay safety argued (or N/A — explain why)
- [ ] Persistence keys still namespaced by mode + wallet kind + address + source chain
- [ ] No new console.log of sensitive data (addresses are fine; private keys / secrets are not)
-->
