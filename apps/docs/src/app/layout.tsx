import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
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
 * Root layout shared by both route groups — `(marketing)` and
 * `(docs)`. Fumadocs's `RootProvider` wraps next-themes (so a single
 * toggle drives both surfaces), the Radix direction context, and the
 * search dialog provider used by the docs sidebar.
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
        <RootProvider
          theme={{
            attribute: "class",
            defaultTheme: "system",
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
