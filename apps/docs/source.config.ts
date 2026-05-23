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
    // Stringify the MDAST and expose it through `page.data.getText("processed")`.
    // The `.md` route and the "Copy as markdown" action both read it.
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: {
    schema: metaSchema,
  },
});

/**
 * Pin Shiki to a dark theme in BOTH light and dark modes. Whisk's
 * code-block chrome (see `globals.css` → `figure.shiki`) renders a
 * dark `#1a1216` surface regardless of the page theme, so we want
 * Shiki to tokenize with dark-mode colours either way. Without this,
 * light-mode pages get light-track tokens (designed for a white bg)
 * sitting on top of the forced dark surface and read as washed out.
 *
 * `github-dark-default` is GitHub's standard dark palette — clear
 * keyword/string/comment contrast on near-black surfaces.
 */
export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-dark-default",
        dark: "github-dark-default",
      },
    },
  },
});
