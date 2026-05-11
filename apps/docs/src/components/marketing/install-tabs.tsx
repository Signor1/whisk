"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-package-manager install command renderer with copy-to-clipboard.
 * Mirrors what we'll wire as a fumadocs MDX component in Phase 3 so
 * the marketing CTA and the docs share a single visual contract.
 */

type Manager = "npm" | "pnpm" | "yarn";

const MANAGER_PREFIX: Record<Manager, string> = {
  npm: "npm install",
  pnpm: "pnpm add",
  yarn: "yarn add",
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

  const command = `${MANAGER_PREFIX[manager]} ${packages.join(" ")}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* swallow — host browser denied clipboard */
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
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
      <pre className="overflow-x-auto px-4 py-3 text-left font-mono text-sm text-foreground">
        <span className="text-muted-foreground">$ </span>
        {command}
      </pre>
    </div>
  );
}
