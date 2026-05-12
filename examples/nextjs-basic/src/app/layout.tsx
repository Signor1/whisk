import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "@signordev/whisk-react/styles.css";
import "./globals.css";

/**
 * Self-host Inter and Geist Mono via Next.js's font API. Whisk reads
 * from `--font-inter` / `--font-geist-mono` on the body, so this is
 * how the widget picks up the playground's typography automatically.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
