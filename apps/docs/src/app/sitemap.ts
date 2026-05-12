import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const SITE_URL = "https://whisk.vercel.app";

/**
 * Sitemap covering both surfaces — marketing landing and every docs
 * page generated from MDX. Adds `/docs` itself plus one entry per
 * generated slug from the source loader.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const docs = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...docs,
  ];
}
