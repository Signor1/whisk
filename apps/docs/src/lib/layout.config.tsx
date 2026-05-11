import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Logo } from "@/components/shared/logo";

/**
 * Base layout props shared by every fumadocs surface (the docs
 * layout, future API reference layout, etc.). Centralising it here
 * means the brand wordmark, the GitHub link, and the cross-link to
 * the marketing landing always stay consistent.
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo showWordmark className="-ml-1" />,
    url: "/",
    transparentMode: "top",
  },
  githubUrl: "https://github.com/Signor1/whisk",
  links: [
    {
      type: "main",
      text: "Landing",
      url: "/",
    },
    {
      type: "main",
      text: "Playground",
      url: "https://whisk-playground.vercel.app",
      external: true,
    },
    {
      type: "main",
      text: "npm",
      url: "https://www.npmjs.com/package/@signordev/whisk-react",
      external: true,
    },
  ],
};
