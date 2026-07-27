import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";
import { getSiteConfig } from "recipe-website-common/config/site";
import { readSettings } from "@/settings";
import { OwnerFooterLinks } from "./OwnerFooterLinks";

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
  const { theme, footerNote, contact } = await readSettings();
  return (
    <AppLayout
      theme={theme}
      footer={{ note: footerNote, contact }}
      footerNavItems={<OwnerFooterLinks />}
    >
      {children}
    </AppLayout>
  );
}
