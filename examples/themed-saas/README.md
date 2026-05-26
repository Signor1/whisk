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
