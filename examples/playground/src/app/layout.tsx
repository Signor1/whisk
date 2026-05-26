import type { Metadata } from "next";
import { Familjen_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "@usewhisk/react/styles.css";
import "./globals.css";

/**
 * Self-host the project's three fonts via Next's font API: Inter for
 * body, Familjen Grotesk for display, JetBrains Mono for code /
 * addresses. The widget reads these via its `--whisk-font` /
 * `--whisk-font-display` / `--whisk-font-mono` stack, so loading them
 * here means the widget picks them up automatically.
 */
const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const display = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Whisk Playground",
  description:
    "Drive the Whisk widget through every config shape — testnet QA surface for sending and bridging USDC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
