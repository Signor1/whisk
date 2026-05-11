import { loader } from "fumadocs-core/source";
import { docs } from "../../.source";

/**
 * Single point of entry for every part of the app that reads from the
 * MDX corpus: page tree (sidebar), search index, slug → page lookup,
 * static-params generation. Fumadocs-mdx is responsible for compiling
 * the MDX (handled by `withMDX(...)` in next.config.ts); we only have
 * to wire the generated `.source` collection into the loader. v16's
 * `toFumadocsSource()` rolls docs + meta into a single source object.
 */
export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
});
