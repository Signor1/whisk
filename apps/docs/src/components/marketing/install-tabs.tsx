"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-manager install command renderer with copy-to-clipboard.
 *
 * The displayed command is colourised the way a real terminal with
 * syntax highlighting (oh-my-zsh, fish, starship + bash-it) would
 * render an install line:
 *
 *   - `$` prompt          → muted
 *   - command verb        → lime / lemon-green (`pnpm`, `npm`, `yarn`)
 *   - subcommand          → sky blue (`add`, `install`)
 *   - package args        → near-white in dark mode, near-black in
 *                           light mode — i.e. default code text
 *
 * The copy action puts the plain (uncoloured) command on the
 * clipboard. Same component is reused by `<InstallCommand>` in docs
 * MDX pages and the closing CTA on the landing.
 */

type Manager = "npm" | "pnpm" | "yarn";

const MANAGER_PREFIX: Record<Manager, [verb: string, subcommand: string]> = {
  npm: ["npm", "install"],
  pnpm: ["pnpm", "add"],
  yarn: ["yarn", "add"],
};

export function InstallTabs({
  packages,
  className,
}: {
  packages: string[];
  className?: string;
}) {
  const [manager, setManager] = useState<Manager>("pnpm");
  const [copied, setCopied] = useState(false);

  const [verb, subcommand] = MANAGER_PREFIX[manager];
  const plainCommand = `${verb} ${subcommand} ${packages.join(" ")}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* host denied clipboard — swallow */
    }
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <nav role="tablist" aria-label="Package manager" className="flex gap-1">
          {(Object.keys(MANAGER_PREFIX) as Manager[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={manager === m}
              type="button"
              onClick={() => setManager(m)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                manager === m
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label="Copy command"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-left font-mono text-sm leading-relaxed">
        <span className="select-none text-muted-foreground">$ </span>
        <span className="font-semibold text-lime-600 dark:text-lime-400">
          {verb}
        </span>
        <span className="text-sky-600 dark:text-sky-400"> {subcommand}</span>
        {packages.map((pkg) => (
          <span key={pkg}>
            <span> </span>
            <span className="text-foreground">{pkg}</span>
          </span>
        ))}
      </pre>
    </div>
  );
}
