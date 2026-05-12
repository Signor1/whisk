import { notFound } from "next/navigation";
import { source } from "@/lib/source";

/**
 * Raw-markdown counterpart to every docs page. Hitting
 * `/docs/getting-started/install.md` returns the processed MDX as
 * plain text, with `Content-Type: text/markdown`.
 *
 * Used by:
 *   • The "View as markdown" action at the top of every docs page.
 *   • The "Copy as markdown for LLM" action, which fetches this URL
 *     and copies the body to the clipboard.
 *   • Anyone scraping the corpus for an internal copy.
 */
export const dynamic = "force-static";
export const revalidate = false;

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_req: Request, context: RouteContext) {
  // The optional catch-all root match can arrive with an undefined
  // params bag in some build phases — guard defensively.
  const params = context?.params ? await context.params : undefined;
  const slug = params?.slug;

  const page = source.getPage(slug);
  if (!page) notFound();

  const markdown = await page.data.getText("processed");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
