import { Hero } from "@/components/marketing/hero";
import { ChainMarquee } from "@/components/marketing/chain-marquee";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { BuiltFor } from "@/components/marketing/built-for";
import { FeatureBento } from "@/components/marketing/feature-bento";
import { RecipesShowcase } from "@/components/marketing/recipes-showcase";
import { Foundation } from "@/components/marketing/foundation";
import { CTA } from "@/components/marketing/cta";

/**
 * Marketing landing — composition root. Order:
 *   hero → trust strip → how-it-works → why-whisk → built-for →
 *   recipes → foundation → CTA.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ChainMarquee />
      <HowItWorks />
      <FeatureBento />
      <BuiltFor />
      <RecipesShowcase />
      <Foundation />
      <CTA />
    </>
  );
}
