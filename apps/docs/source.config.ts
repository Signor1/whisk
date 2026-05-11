import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from "fumadocs-mdx/config";

/**
 * Fumadocs source config — points the loader at `src/content/docs/` and
 * gives every MDX file the standard `title` / `description` /
 * `full` frontmatter contract. `meta.json` sidecar files use
 * `metaSchema` to declare nested-folder titles + ordering.
 */
export const docs = defineDocs({
  dir: "src/content/docs",
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig();
