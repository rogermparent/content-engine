import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";

export const metadata: Metadata = {
  title: "Recipe Editor",
  description: "A recipe book app built with Next 14.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
