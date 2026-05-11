import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  // Transpile our workspace packages so MDX live snippets and the
  // marketing page can reach into them from source during dev without
  // requiring a separate build step.
  transpilePackages: ["@signordev/whisk-core", "@signordev/whisk-react"],
};

export default withMDX(config);
