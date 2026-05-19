# Security policy

Whisk moves user funds. If you find a security issue, please report it
**privately first** so we can ship a fix before the details become
public. Public issues that disclose exploitable behaviour put real
users' money at risk.

## How to report

**Preferred channel: GitHub's private vulnerability reporting.**

1. Visit the
   [Security tab](https://github.com/Signor1/whisk/security/advisories)
   of this repository.
2. Click **Report a vulnerability**.
3. Describe the issue with enough detail for us to reproduce.

GitHub keeps the report private between the reporter and the
maintainers until we publish an advisory.

**If you can't use GitHub Security Advisories** (no account, anonymous
report), email **security@signordev.dev** with the same content. PGP
key available on request.

## What to include

A useful report has, at minimum:

- A short description of the impact (loss of funds? wrong recipient?
  signature replay? UI deception?).
- Repro steps — chain pair, wallet, exact widget config, the inputs
  that triggered the issue.
- Whichever package and version surfaced it
  (`@signordev/whisk-core`, `@signordev/whisk-react`, App Kit
  version, viem version).
- A suggested severity if you have one (see scope below).

A working proof-of-concept is appreciated but not required. Suspected
issues without a PoC are still welcome — we'd rather investigate a
false alarm than miss something real.

## Scope

**In scope** (please report):

- Anything that can route a user's funds to an address they didn't
  consent to.
- Anything that lets a user double-sign / double-burn without
  realising.
- Recovery primitives (mid-flight retry, manual mint, Iris polling,
  persistence) producing incorrect addresses, replaying nonces, or
  leaking entity secrets.
- Cross-tab coordination weaknesses that allow simultaneous
  signature prompts on the same wallet + chain.
- Resolver bypasses — an ENS / address resolver returning data that
  fails the destination chain's regex but is still accepted by the
  engine.
- Persistence leaks — recovery snapshots in `localStorage` leaking
  across origins, mode boundaries, or wallet addresses.
- Telemetry leaks — Whisk sending PII to any endpoint without consent.
- Build / supply-chain risks — postinstall scripts, suspicious
  transitive deps, lockfile poisoning paths.

**Out of scope** (these are not security issues here):

- Issues in App Kit, viem, wagmi, Solana wallet adapter, or other
  upstream dependencies. Please report those upstream; if there's a
  Whisk-side mitigation we can apply in the meantime, file it
  separately as a feature request.
- Issues in Circle's Iris attestation service or MessageTransmitter
  contracts. Report directly to Circle.
- DoS via excessive RPC traffic (rate limits are the RPC provider's
  responsibility).
- The user's wallet rejecting a transaction (expected behaviour).
- Insecure RPC endpoints the host application configured themselves
  (consumer responsibility, not the widget's).

## Response timeline

| Stage | Target |
| --- | --- |
| Acknowledgement | within 72 hours |
| Severity assessment | within 7 days |
| Patch released (high-severity) | within 14 days |
| Patch released (medium-severity) | next minor release |
| Public advisory + CVE | after patch lands + reasonable window for downstream upgrades |

We aim to credit reporters in the advisory unless they ask for
anonymity.

## Supported versions

Pre-1.0, only the latest minor release of each package is supported
for security patches. After 1.0, the policy becomes:

- Latest minor: full support.
- Previous minor: critical fixes only, for 6 months after the next
  minor ships.

Older versions: please upgrade.

## What we won't do

- We won't sue you for good-faith research.
- We won't reach out to your employer.
- We won't publish details before the fix lands.

Thanks for keeping users safe.
