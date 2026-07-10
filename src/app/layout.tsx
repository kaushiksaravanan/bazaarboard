import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BazaarBoard — Live regional-language marketing assets for kirana & vendors",
  description:
    "Type a product + price in any Indian language, and BazaarBoard renders print-ready posters, WhatsApp Business status, and Google Business Profile cards live — powered by Gemini's Nano Banana 2 Lite for sub-4-second, script-accurate image generation.",
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
      <body>{children}</body>
    </html>
  );
}
