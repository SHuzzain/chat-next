import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LMS Assistant",
};

export default function EmbedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
