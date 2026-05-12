import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

/**
 * Search index built from the same loader the page tree uses.
 * Indexes every MDX file under `src/content/docs/` and serves
 * `/api/search?query=...` for the docs sidebar search dialog.
 */
export const { GET } = createFromSource(source);
