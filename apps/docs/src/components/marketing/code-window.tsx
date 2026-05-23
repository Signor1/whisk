import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared mac-style code window. Every code snippet on the landing
 * page renders through this shell so the chrome (traffic-light dots
 * + optional filename tab) and the inner gutter style stay identical
 * everywhere.
 *
 * Use it two ways:
 *
 * 1. Token-array body — declarative line/token data, syntax-coloured
 *    automatically. Best for headline snippets where consistency
 *    matters more than fidelity.
 *
 *    ```tsx
 *    <CodeWindow filename="app/layout.tsx" lines={[
 *      [{ t: "import", c: "keyword" }, { t: " { WhiskProvider }" }],
 *      [],
 *      [{ t: "// ..." }],
 *    ]} />
 *    ```
 *
 * 2. Children body — full creative control for one-off shapes (terminal
 *    output, multi-region snippets, hand-tuned highlighting).
 *
 *    ```tsx
 *    <CodeWindow filename="install.sh"><pre>...</pre></CodeWindow>
 *    ```
 */

export type TokenKind =
  | "comment"
  | "keyword"
  | "string"
  | "string-err"
  | "operator"
  | "type"
  | "comp"
  | "fn"
  | "attr"
  | "bracket"
  | "error";

export type Token = { t: string; c?: TokenKind };
export type CodeLine = Token[] | null;

export function CodeWindow({
  filename,
  lines,
  children,
  className,
  size = "md",
  showLineNumbers = true,
}: {
  filename?: string;
  /** Token-array body. Mutually exclusive with `children`. */
  lines?: ReadonlyArray<CodeLine>;
  /** Free-form body. Mutually exclusive with `lines`. */
  children?: ReactNode;
  className?: string;
  size?: "sm" | "md";
  /** Hide the left gutter (useful for one-line snippets / terminals). */
  showLineNumbers?: boolean;
}) {
  const md = size === "md";
  return (
    <div
      className={cn(
        "w-full max-w-full overflow-hidden rounded-2xl border border-foreground/15 bg-[#1a1216] shadow-lg shadow-foreground/5",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 border-b border-white/10",
          md ? "px-4 py-2.5" : "px-3 py-2",
        )}
      >
        <Dot color="rose" md={md} />
        <Dot color="amber" md={md} />
        <Dot color="emerald" md={md} />
        {filename && (
          <span
            className={cn(
              "ml-3 font-mono text-white/40",
              md ? "text-[11px]" : "text-[10.5px]",
            )}
          >
            {filename}
          </span>
        )}
      </div>

      {children ? (
        children
      ) : lines ? (
        <CodeBody lines={lines} size={size} showLineNumbers={showLineNumbers} />
      ) : null}
    </div>
  );
}

function Dot({
  color,
  md,
}: {
  color: "rose" | "amber" | "emerald";
  md: boolean;
}) {
  const palette = {
    rose: "bg-rose-400/60",
    amber: "bg-amber-400/60",
    emerald: "bg-emerald-400/60",
  };
  return (
    <span
      className={cn(
        "rounded-full",
        md ? "h-2.5 w-2.5" : "h-2 w-2",
        palette[color],
      )}
    />
  );
}

export function CodeBody({
  lines,
  size = "md",
  showLineNumbers = true,
}: {
  lines: ReadonlyArray<CodeLine>;
  size?: "sm" | "md";
  showLineNumbers?: boolean;
}) {
  const md = size === "md";
  const gutterWidth = lines.length >= 10 ? "w-5" : "w-4";
  return (
    <pre
      className={cn(
        "overflow-x-auto font-mono text-white/85",
        md
          ? "px-4 py-3.5 text-[11px] leading-[1.65] sm:px-5 sm:py-4 sm:text-[12.5px] sm:leading-[1.7]"
          : "px-3 py-2.5 text-[10.5px] leading-[1.6] sm:text-[11px] sm:leading-[1.65]",
      )}
    >
      <code className="block">
        {lines.map((line, li) => (
          <span key={li} className="flex">
            {showLineNumbers && (
              <span
                className={cn(
                  "mr-4 select-none text-right text-white/25",
                  gutterWidth,
                )}
              >
                {li + 1}
              </span>
            )}
            <span className="flex-1 whitespace-pre">
              {!line || line.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                line.map((tok, ti) => (
                  <span key={ti} className={syntaxClass(tok.c)}>
                    {tok.t}
                  </span>
                ))
              )}
            </span>
          </span>
        ))}
      </code>
    </pre>
  );
}

function syntaxClass(kind?: TokenKind): string {
  switch (kind) {
    case "comment":
      return "text-white/35 italic";
    case "keyword":
      return "text-[#e57d8e]";
    case "string":
      return "text-[#9ed084]";
    case "string-err":
      return "text-[#9ed084] underline decoration-rose-400 decoration-wavy";
    case "operator":
      return "text-white/60";
    case "type":
    case "comp":
      return "text-[#7fc6e7]";
    case "fn":
    case "attr":
      return "text-[#f5c272]";
    case "bracket":
      return "text-white/55";
    case "error":
      return "text-rose-300/90";
    default:
      return "";
  }
}
