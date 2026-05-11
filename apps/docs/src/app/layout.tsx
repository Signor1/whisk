import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import "./globals.css";

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

const SITE_URL = "https://whisk.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Whisk — embeddable USDC send & bridge widget for React",
    template: "%s · Whisk",
  },
  description:
    "Drop-in React component for sending and bridging USDC across any chain. Built on Circle App Kit. MIT licensed.",
  keywords: [
    "USDC",
    "Circle",
    "App Kit",
    "CCTP",
    "stablecoin",
    "bridge",
    "React",
    "widget",
    "Web3",
  ],
  authors: [{ name: "SignorDev", url: "https://github.com/Signor1" }],
  openGraph: {
    type: "website",
    siteName: "Whisk",
    title: "Whisk — embeddable USDC send & bridge widget for React",
    description:
      "Send and bridge USDC across any chain with one React component.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Whisk — embeddable USDC send & bridge widget for React",
    description:
      "Send and bridge USDC across any chain with one React component.",
  },
};

/**
 * Root layout. Shared by both route groups — `(marketing)` and
 * `(docs)`. The `ThemeProvider` lives here so a single toggle drives
 * the entire app: marketing hero, fumadocs sidebar, code blocks, the
 * lot.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
