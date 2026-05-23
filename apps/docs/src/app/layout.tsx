import type { Metadata } from "next";
import {
  Familjen_Grotesk,
  Inter,
  JetBrains_Mono,
  IBM_Plex_Mono,
} from "next/font/google";
import { RootProvider } from "fumadocs-ui/provider/next";
import "./globals.css";

// Body sans. Inter is the proven workhorse — maximally readable from
// display sizes down to 12px and the default of every well-designed
// dev tool. Pairs cleanly with Familjen Grotesk for headlines.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Display typeface — hero headlines, section titles. Familjen Grotesk
// adds character (slightly humanist g, distinct a) without spoiling
// readability the way more decorative display faces would.
const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

// Code blocks. JetBrains Mono is the canonical choice for engineer-facing
// docs — wide x-height, clear l/I/1 disambiguation, ligatures for `=>`.
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

// Inline-code emphasis (`prose code` inside paragraphs). IBM Plex Mono
// has true italic glyphs with a near-cursive feel — distinct enough
// from JetBrains Mono that inline `code` mentions read as emphasized
// language references rather than code-block excerpts.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-mono-italic",
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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    siteName: "Whisk",
    title: "Whisk — embeddable USDC send & bridge widget for React",
    description:
      "Send and bridge USDC across any chain with one React component.",
    url: SITE_URL,
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Whisk — embeddable USDC send & bridge widget for React",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whisk — embeddable USDC send & bridge widget for React",
    description:
      "Send and bridge USDC across any chain with one React component.",
    images: [
      {
        url: "/thumbnail.png",
        width: 1200,
        height: 630,
        alt: "Whisk — embeddable USDC send & bridge widget for React",
      },
    ],
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
      className={`${inter.variable} ${familjenGrotesk.variable} ${jetBrainsMono.variable} ${ibmPlexMono.variable}`}
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
