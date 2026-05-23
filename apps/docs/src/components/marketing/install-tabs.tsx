"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Per-manager install command renderer with copy-to-clipboard.
 *
 * The shell matches the project's shared `<CodeWindow>` chrome (traffic
 * lights + filename strip + dark `#1a1216` body) so every code surface
 * on the marketing site reads as one system. The package-manager tabs
 * sit inline in that filename strip.
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
        "overflow-hidden rounded-2xl border border-foreground/15 bg-[#1a1216] shadow-lg shadow-foreground/5",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
        </div>
        <nav role="tablist" aria-label="Package manager" className="flex gap-1">
          {(Object.keys(MANAGER_PREFIX) as Manager[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={manager === m}
              type="button"
              onClick={() => setManager(m)}
              className={cn(
                "rounded-md px-2.5 py-0.5 font-mono text-[11px] transition-colors",
                manager === m
                  ? "bg-white/10 text-white/90"
                  : "text-white/40 hover:text-white/70",
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
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white/85"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-white/85">
        <span className="select-none text-white/35">$ </span>
        <span className="text-[#9ed084]">{verb}</span>
        <span className="text-[#7fc6e7]"> {subcommand}</span>
        {packages.map((pkg) => (
          <span key={pkg}>
            <span> </span>
            <span className="text-white/85">{pkg}</span>
          </span>
        ))}
      </pre>
    </div>
  );
}
