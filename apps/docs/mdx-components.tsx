import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { Steps, Step } from "fumadocs-ui/components/steps";
import { Callout } from "fumadocs-ui/components/callout";
import { Card, Cards } from "fumadocs-ui/components/card";
import { InstallCommand } from "@/components/mdx/install-command";

/**
 * The MDX component map for the whole docs corpus. Every MDX file
 * picks these up without an explicit import.
 *
 * Conventions:
 *   - `<InstallCommand packages={...} />` for any install instruction.
 *     It always renders npm / pnpm / yarn tabs with a copy button.
 *   - `<Tabs items={...}>`/`<Tab value=...>` for code variations or
 *     language toggles (TS vs JS, server vs client).
 *   - `<Steps>` / `<Step>` for ordered procedural docs.
 *   - `<Callout type=...>` for info / warn / error notes.
 *   - `<Cards>` / `<Card>` for recipe grids inside docs pages.
 *
 * Return type is inferred — fumadocs-ui already declares the
 * `mdx/types.js` module augmentation, so `MDXContent` consumers see
 * the merged shape without us importing `mdx/types` directly (which
 * would require `@types/mdx`).
 */
export function getMDXComponents(
  components?: Record<string, React.ComponentType<unknown>>,
) {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    Steps,
    Step,
    Callout,
    Card,
    Cards,
    InstallCommand,
    ...components,
  };
}
