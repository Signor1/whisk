import Link from "next/link";
import { Logo } from "@/components/shared/logo";

/**
 * Brand-aligned 404. Same earth-tone palette as the rest of the site,
 * single CTA back to the docs index, plus a quiet "where else to go"
 * row so visitors who hit a renamed page don't bounce.
 */
export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12),transparent_60%)]"
      />

      <Logo className="mb-8" />

      <p className="text-sm font-medium uppercase tracking-wider text-primary">
        404
      </p>
      <h1 className="mt-3 text-balance text-center text-4xl font-semibold tracking-tight sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-balance text-center text-muted-foreground">
        The link you followed may be broken, or the page may have moved. Try one
        of these:
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to landing
        </Link>
        <Link
          href="/docs"
          className="inline-flex h-10 items-center rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Read the docs
        </Link>
        <a
          href="https://github.com/Signor1/whisk/issues"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Open an issue
        </a>
      </div>
    </main>
  );
}
