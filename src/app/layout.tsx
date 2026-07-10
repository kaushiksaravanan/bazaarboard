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
      <body>{children}</body>
    </html>
  );
}
