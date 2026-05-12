import { notFound } from "next/navigation";
import { source } from "@/lib/source";

/**
 * Raw-markdown counterpart for the docs index page.
 *
 * The `[[...slug]].md` route handles every other doc page, but the
 * optional catch-all resolves the empty-slug case to `/docs/.md`,
 * which is a different URL than the `/docs.md` we want for the
 * index. A dedicated route covers that one case.
 */
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const page = source.getPage([]);
  if (!page) notFound();

  const markdown = await page.data.getText("processed");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=86400",
    },
  });
}
