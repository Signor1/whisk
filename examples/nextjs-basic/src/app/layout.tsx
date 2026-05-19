import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "@signordev/whisk-react/styles.css";
import "./globals.css";

/**
 * Self-host Plus Jakarta Sans + JetBrains Mono via Next's font API.
 * The widget reads the `--whisk-font` / `--whisk-font-mono` stack,
 * which now lists these two as the preferred families — so loading
 * them here means the widget picks them up automatically without any
 * extra wiring.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
