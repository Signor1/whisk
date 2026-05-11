import { Hero } from "@/components/marketing/hero";
import { ChainMarquee } from "@/components/marketing/chain-marquee";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { Recipes } from "@/components/marketing/recipes";
import { CTA } from "@/components/marketing/cta";

/**
 * Marketing landing — composition root. Order matches the Phase 2
 * plan: hero → trust strip → features → recipes → CTA. Each section
 * is self-contained; remove or reorder freely.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ChainMarquee />
      <FeatureBento />
      <Recipes />
      <CTA />
    </>
  );
}
