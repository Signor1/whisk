import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/../mdx-components";
import { PageActions } from "@/components/docs/page-actions";

/**
 * Slug-driven MDX renderer. Every page tree node resolves through
 * `source.getPage(...)`; if the slug doesn't match a file we 404.
 *
 * `editOnGithub` adds the "Edit this page" link on the article footer
 * pointing at the canonical source path in the monorepo.
 */
export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      editOnGithub={{
        owner: "Signor1",
        repo: "whisk",
        sha: "main",
        path: `apps/docs/src/content/docs/${page.path}`,
      }}
      // Tighten the article horizontal padding. Fumadocs's default is
      // `px-4 md:px-6 xl:px-8`; this leans into the available width.
      className="px-3 md:px-4 xl:px-6"
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="mb-6 flex justify-end">
        <PageActions markdownUrl={`${page.url}.md`} />
      </div>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
