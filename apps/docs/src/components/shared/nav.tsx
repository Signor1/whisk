import Link from "next/link";
import { Github } from "lucide-react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

/**
 * Shared top nav rendered on every marketing surface. The fumadocs
 * docs route gets its own header via fumadocs-ui's layout, so this
 * component does not bleed into `/docs/*`.
 */
export function Nav({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-md",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Whisk home"
        >
          <Logo />
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
          <Link
            href="/docs"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            href="/#examples"
            className="hidden transition-colors hover:text-foreground sm:inline-flex"
          >
            Examples
          </Link>
          <a
            href="https://www.npmjs.com/package/@signordev/whisk-react"
            target="_blank"
            rel="noreferrer"
            className="hidden transition-colors hover:text-foreground sm:inline-flex"
          >
            npm
          </a>
          <a
            href="https://github.com/Signor1/whisk"
            target="_blank"
            rel="noreferrer"
            aria-label="Whisk on GitHub"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
