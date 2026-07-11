import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BazaarBoard — Voice mode",
  description: "Speak in any Indian language. Get shop posters in seconds.",
};

export default function VoiceLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
