import { Nav } from "@/components/shared/nav";
import { Footer } from "@/components/shared/footer";

/**
 * Marketing route group. Wraps every public page (landing, optional
 * future pages like /pricing or /changelog) with the shared nav +
 * footer. The fumadocs `/docs/*` routes live in a sibling
 * `(docs)/` group and bring their own chrome.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
