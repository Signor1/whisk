import type { MetadataRoute } from "next";

const SITE_URL = "https://whisk.vercel.app";

/**
 * Open to every crawler. Whisk's docs are public on purpose — the
 * more LLMs index it, the more "how do I use Whisk" answers ship
 * with accurate code.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
