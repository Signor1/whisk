import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,

  // Transpile our workspace packages so the example can run from source
  // (no need to build dist before `pnpm dev`). Production `next build`
  // still resolves the published exports cleanly.
  transpilePackages: ["@strimz/whisk-core", "@strimz/whisk-react"],

  webpack: (config) => {
    // wagmi v2's connector barrel transitively pulls a couple of optional
    // deps that don't exist (or aren't used) in browser builds:
    //
    //   - @react-native-async-storage/async-storage  (MetaMask SDK)
    //   - pino-pretty                                (WalletConnect logger)
    //
    // Stubbing them to `false` tells webpack "treat as empty module" so
    // the build doesn't error out on missing imports the browser will
    // never reach. This is the documented wagmi + Next.js pattern.
    config.resolve = config.resolve ?? {};
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
    };

    // Suppress "Critical dependency: the request of a dependency is an
    // expression" warnings emitted by viem's `ox/tempo` dynamic chain
    // imports — viem loads chain definitions on demand and the warning
    // is benign.
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /node_modules\/ox\// },
      /Critical dependency: the request of a dependency is an expression/,
    ];

    return config;
  },
};

export default config;
