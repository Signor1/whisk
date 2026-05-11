"use client";

import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Single source of truth for theme state across the marketing surfaces
 * AND the fumadocs prose. `next-themes` sets `class="dark"` on `<html>`,
 * which the brand-token CSS variables in `globals.css` consume via
 * `.dark { … }` — so flipping the toggle instantly re-themes the entire
 * site (hero, code blocks, sidebar, nav, the lot).
 *
 * Wraps the official provider only to centralise sensible defaults:
 * follow the OS by default, write to the `class` attribute on `<html>`,
 * suppress the first-paint mismatch warning during hydration.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
