"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Sparkles,
} from "lucide-react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Per-page action cluster rendered top-right on every docs article.
 * Three things visitors usually want:
 *
 *   • Copy page              – grabs the rendered text (markdown body).
 *   • Copy as Markdown (LLM) – same payload, framed for chat models.
 *   • View as Markdown       – opens the raw `.md` endpoint in a tab.
 *
 * The component fetches the `.md` route lazily, only when one of
 * those actions fires. Until then it's just three buttons.
 */
export function PageActions({ markdownUrl }: { markdownUrl: string }) {
  const [copied, setCopied] = useState<null | "page" | "llm">(null);

  async function fetchMarkdown(): Promise<string> {
    const res = await fetch(markdownUrl);
    if (!res.ok) throw new Error(`Couldn't fetch ${markdownUrl}: ${res.status}`);
    return res.text();
  }

  async function handle(action: "page" | "llm" | "view") {
    if (action === "view") {
      window.open(markdownUrl, "_blank", "noopener,noreferrer");
      return;
    }

    try {
      const body = await fetchMarkdown();
      const payload =
        action === "llm"
          ? `Here's the relevant Whisk documentation. Use it to answer my question accurately and cite sections by heading.\n\n---\n\n${body}`
          : body;

      await navigator.clipboard.writeText(payload);
      setCopied(action);
      setTimeout(() => setCopied(null), 1600);
    } catch (err) {
      console.error("Page action failed:", err);
    }
  }

  return (
    <div className="not-prose flex items-center gap-1">
      {/* Primary: Copy page */}
      <button
        type="button"
        onClick={() => handle("page")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-md border border-fd-border bg-fd-card px-2.5 text-xs font-medium text-fd-foreground transition-colors hover:bg-fd-muted",
        )}
      >
        {copied === "page" ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-500" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy page
          </>
        )}
      </button>

      {/* Dropdown: more options */}
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <button
            type="button"
            aria-label="More page actions"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border bg-fd-card text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </Dropdown.Trigger>

        <Dropdown.Portal>
          <Dropdown.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[15rem] rounded-md border border-fd-border bg-fd-popover p-1 text-sm text-fd-popover-foreground shadow-md outline-none"
          >
            <ActionItem
              icon={<Sparkles className="h-3.5 w-3.5" />}
              title="Copy as Markdown for LLM"
              hint="With a prompt header your model will use"
              copied={copied === "llm"}
              onSelect={() => handle("llm")}
            />
            <Dropdown.Separator className="my-1 h-px bg-fd-border" />
            <ActionItem
              icon={<FileText className="h-3.5 w-3.5" />}
              title="View as Markdown"
              hint="Opens the raw .md file"
              suffix={<ExternalLink className="h-3 w-3 opacity-50" />}
              onSelect={() => handle("view")}
            />
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
    </div>
  );
}

function ActionItem({
  icon,
  title,
  hint,
  suffix,
  copied,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  suffix?: React.ReactNode;
  copied?: boolean;
  onSelect: () => void;
}) {
  return (
    <Dropdown.Item
      onSelect={(e) => {
        e.preventDefault();
        onSelect();
      }}
      className="flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 outline-none focus:bg-fd-muted data-[highlighted]:bg-fd-muted"
    >
      <span className="text-fd-muted-foreground">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : icon}
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-medium text-fd-foreground">
          {copied ? "Copied" : title}
        </span>
        <span className="block text-[11px] text-fd-muted-foreground">
          {hint}
        </span>
      </span>
      {suffix}
    </Dropdown.Item>
  );
}
