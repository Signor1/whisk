"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Light / dark toggle. Renders an inert placeholder on the server so
 * the hydration markup matches before next-themes has read the OS
 * preference / cookie — without this guard, the first paint flickers.
 *
 * Cycles `light → dark → system`. The label updates accordingly.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const next = mounted
    ? resolvedTheme === "dark"
      ? "light"
      : "dark"
    : "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={
        mounted
          ? `Switch to ${next} mode (currently ${theme})`
          : "Toggle theme"
      }
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
