import Link from "next/link";
import { Logo } from "./logo";

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Examples", href: "/#examples" },
      { label: "Playground", href: "https://whisk-playground.vercel.app" },
    ],
  },
  {
    title: "Packages",
    links: [
      {
        label: "@signordev/whisk-react",
        href: "https://www.npmjs.com/package/@signordev/whisk-react",
      },
      {
        label: "@signordev/whisk-core",
        href: "https://www.npmjs.com/package/@signordev/whisk-core",
      },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/Signor1/whisk" },
      {
        label: "Issues",
        href: "https://github.com/Signor1/whisk/issues",
      },
    ],
  },
];

/**
 * Site-wide footer. Three link columns + brand block. Surfaces on the
 * marketing route group; fumadocs renders its own page footer inside
 * `/docs/*`.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Drop-in USDC send & bridge widget for React. Built on Circle
            App Kit. MIT licensed.
          </p>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {group.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => {
                const external = link.href.startsWith("http");
                return (
                  <li key={link.label}>
                    {external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Whisk. MIT licensed.</span>
          <span>
            Made with{" "}
            <a
              href="https://docs.arc.network/app-kit"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Circle App Kit
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
