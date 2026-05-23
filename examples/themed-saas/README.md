# whisk-example-themed-saas

A SaaS dashboard with the Whisk widget retrofitted to match a corporate
navy / teal palette. The default earth-tone Whisk theme is replaced via
CSS variable overrides — no fork, no re-export, just a stylesheet.

## What's interesting

- Every visible property of the widget — background, text, borders,
  primary CTA, success / warning / destructive tones, even the corner
  radii — is exposed as a `--whisk-*` CSS variable.
- `globals.css` redefines all of them under `[data-whisk]` and
  `[data-whisk][data-whisk-theme="dark"]`. The provider then stamps the
  attribute on the widget root and your overrides take effect.
- App chrome has its own variables (`--app-*`) that happen to share the
  navy palette — looks intentional rather than transplanted.

## Run

```bash
pnpm install
pnpm --filter @usewhisk/example-themed-saas dev
```

Open <http://localhost:3012>.
