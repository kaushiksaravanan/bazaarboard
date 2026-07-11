import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { WebVitals } from "./vitals";

const SITE_URL = "https://bazaarboard.vercel.app";
const TITLE =
  "BazaarBoard — Live regional-language marketing assets for kirana & vendors";
const DESCRIPTION =
  "Type a product + price in any Indian language, and BazaarBoard renders print-ready posters, WhatsApp Business status, and Google Business Profile cards live — powered by Gemini's Nano Banana 2 Lite for sub-4-second, script-accurate image generation across eight Indic scripts.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "BazaarBoard",
  authors: [{ name: "Kaushik Saravanan" }],
  creator: "Kaushik Saravanan",
  publisher: "BazaarBoard",
  keywords: [
    "Indic scripts",
    "Devanagari",
    "Tamil",
    "Bengali",
    "Telugu",
    "Kannada",
    "Malayalam",
    "Gurmukhi",
    "Gujarati",
    "kirana",
    "WhatsApp Business",
    "Google Business Profile",
    "poster generator",
    "regional-language marketing",
    "Gemini Nano Banana 2 Lite",
    "NB2 Lite",
    "dynamic ad localizer",
    "India small business",
    "hackathon",
  ],
  category: "productivity",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.svg", type: "image/svg+xml", sizes: "192x192" },
      { url: "/icon-512.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "BazaarBoard",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "BazaarBoard — live regional-language marketing assets in eight Indic scripts",
        type: "image/svg+xml",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.svg"],
    creator: "@kaushiksrv",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0f2e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Noto+Sans+Devanagari:wght@400..900&family=Noto+Sans+Tamil:wght@400..900&family=Noto+Sans+Bengali:wght@400..900&family=Noto+Sans+Telugu:wght@400..900&family=Noto+Sans+Kannada:wght@400..900&family=Noto+Sans+Malayalam:wght@400..900&family=Noto+Sans+Gurmukhi:wght@400..900&family=Noto+Sans+Gujarati:wght@400..900&display=swap"
        />
      </head>
      <body>
        <WebVitals />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
