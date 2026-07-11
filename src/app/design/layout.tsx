import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BazaarBoard · Live design",
  description: "Speak. It renders. As you talk.",
};

export default function DesignLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <>{children}</>;
}
