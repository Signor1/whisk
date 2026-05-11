/**
 * Fumadocs slug-driven page renderer. Phase 1 ships a placeholder
 * that confirms the route is wired; Phase 3 swaps this for the full
 * fumadocs `<DocsPage>` shell with sidebar, search, and TOC, reading
 * from `source.config.ts`.
 */
export default function DocsPlaceholder() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Phase 1 scaffold
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Docs route, wired
        </h1>
        <p className="mt-3 text-muted-foreground">
          The fumadocs shell + brand-themed sidebar + search land in
          Phase 3, and the content pages (Getting Started, Concepts,
          Components, Hooks, Theming, Recipes, API reference) land in
          Phase 4. The MDX source files already live under{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
            src/content/docs/
          </code>
          .
        </p>
        <a
          href="/"
          className="mt-6 inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          ← Back to landing
        </a>
      </div>
    </div>
  );
}
