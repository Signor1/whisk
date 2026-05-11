import { InstallTabs } from "@/components/marketing/install-tabs";

/**
 * MDX-friendly wrapper around the marketing InstallTabs component.
 * Every `<InstallCommand packages={["a", "b"]} />` in an MDX page
 * renders the same npm / pnpm / yarn tab strip the landing CTA does,
 * so visitors get a consistent install affordance on every surface.
 */
export function InstallCommand({ packages }: { packages: string[] }) {
  return (
    <div className="not-prose my-6">
      <InstallTabs packages={packages} />
    </div>
  );
}
