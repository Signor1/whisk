/**
 * Optional Tailwind preset for Whisk.
 *
 * Importing this and adding it to your `tailwind.config.{js,ts}` `presets`
 * array maps Whisk's CSS variables to Tailwind colour / radius / font
 * tokens. After the preset is applied you can write `bg-whisk-primary`,
 * `text-whisk-fg-muted`, `rounded-whisk` etc. directly in your JSX.
 *
 * The CSS variables themselves still come from the default `styles.css`
 * — the preset is purely a Tailwind ergonomic layer on top.
 *
 * @example
 *   // tailwind.config.ts
 *   import type { Config } from "tailwindcss";
 *   import { whiskTheme } from "@signordev/whisk-react/tailwind";
 *
 *   export default {
 *     presets: [whiskTheme()],
 *     content: [...],
 *   } satisfies Config;
 */

const v = (name: string) => `var(--whisk-${name})`;

export type WhiskThemeOptions = {
  /**
   * Prefix applied to every Whisk-mapped Tailwind class.
   * @default "whisk"
   */
  prefix?: string;
};

/**
 * Whisk Tailwind preset. Returns a Tailwind config fragment with colour,
 * radius, and font-family tokens wired to Whisk's CSS variables.
 *
 * Tokens are emitted as `var(--whisk-...)` rather than HSL channels — the
 * CSS variables are stored as hex in `styles.css`, so opacity composition
 * inside Tailwind classes uses `color-mix()` instead of the channel/alpha
 * pattern shadcn relies on.
 */
export function whiskTheme(options: WhiskThemeOptions = {}) {
  const prefix = options.prefix ?? "whisk";
  return {
    theme: {
      extend: {
        colors: {
          [`${prefix}-bg`]: v("bg"),
          [`${prefix}-fg`]: v("fg"),
          [`${prefix}-fg-muted`]: v("fg-muted"),
          [`${prefix}-card`]: v("card"),
          [`${prefix}-card-fg`]: v("card-fg"),
          [`${prefix}-border`]: v("border"),
          [`${prefix}-input`]: v("input"),
          [`${prefix}-ring`]: v("ring"),
          [`${prefix}-primary`]: v("primary"),
          [`${prefix}-primary-fg`]: v("primary-fg"),
          [`${prefix}-success`]: v("success"),
          [`${prefix}-warning`]: v("warning"),
          [`${prefix}-destructive`]: v("destructive"),
          [`${prefix}-destructive-fg`]: v("destructive-fg"),
        },
        borderRadius: {
          [prefix]: "var(--whisk-radius)",
          [`${prefix}-sm`]: "var(--whisk-radius-sm)",
          [`${prefix}-lg`]: "var(--whisk-radius-lg)",
        },
        fontFamily: {
          [prefix]: "var(--whisk-font)",
          [`${prefix}-mono`]: "var(--whisk-font-mono)",
        },
      },
    },
  };
}

export default whiskTheme;
