import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "@strimz/whisk-react/styles.css";
import "./globals.css";
import { Providers } from "./providers";

/**
 * Self-host Inter and Geist Mono via Next.js's font API. Whisk's font
 * stack picks them up automatically because the variable is exposed as
 * `--font-inter` / `--font-geist-mono` on the body, and Whisk's CSS
 * stack lists Inter as the first preferred family.
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
  title: "Whisk — embeddable USDC widget",
  description:
    "Drop-in showcase: send & bridge USDC across chains with one React component.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
