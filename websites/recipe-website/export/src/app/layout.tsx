import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";
import { getSiteConfig } from "recipe-website-common/config/site";

const { title, description } = getSiteConfig();

export const metadata: Metadata = {
  title,
  description,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
