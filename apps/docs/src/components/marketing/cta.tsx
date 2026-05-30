import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InstallTabs } from "./install-tabs";
import { FramedSection } from "./framed-section";

/**
 * Closing CTA — install snippet flanked by docs + GitHub CTAs.
 * The third call-to-action visitors see; first was the hero, second
 * the bento. Three is usually enough.
 */
export function CTA({ className }: { className?: string }) {
  return (
    <FramedSection
      noBottom
      className={className}
      innerClassName="py-24 sm:py-32"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-balance font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Three lines and you're shipping.
        </h2>
        <p className="mt-4 text-balance text-base text-foreground/75 sm:text-lg">
          Install the package, mount the provider, render the widget. The rest
          of the docs is just helping you go further than the three-line
          version.
        </p>

        <div className="mx-auto mt-8 max-w-xl text-left">
          <InstallTabs packages={["@usewhisk/react"]} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/docs/getting-started/install"
            className="inline-flex h-11 items-center gap-1.5 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Read the docs
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/Signor1/whisk"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center rounded-md border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Star on GitHub
          </a>
        </div>
      </div>
    </FramedSection>
  );
}
