import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/lib/source";
import { baseOptions } from "@/lib/layout.config";

/**
 * Fumadocs docs shell — sidebar, top nav, search, theme toggle. The
 * `tree` comes from the loader built off `.source/`. Every `/docs/*`
 * route in the `(docs)` group renders inside this layout.
 */
export default function DocsRouteLayout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={source.pageTree} {...baseOptions}>
      {children}
    </DocsLayout>
  );
}
