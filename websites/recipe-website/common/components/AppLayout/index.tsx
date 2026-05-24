import Link from "next/link";
import getMenuBySlug from "@discontent/menus-collection/controller/data/read";
import { MenuItem } from "@discontent/menus-collection/controller/types";
import { ReactNode } from "react";
import { AppProviders } from "./AppProviders";
import { getSiteConfig } from "../../config/site";
import { HeaderNav, FooterNav } from "./nav";

const defaultFooterItems: MenuItem[] = [
  { name: "Search", href: "/search" },
  { name: "New Recipe", href: "/new-recipe" },
  { name: "Settings", href: "/settings" },
];

const defaultHeaderItems: MenuItem[] = [
  { name: "Bookmarks", href: "/bookmarks" },
];

interface SiteHeaderProps {
  extraNavItems?: ReactNode;
}

async function SiteHeader({ extraNavItems }: SiteHeaderProps) {
  const headerMenu = await getMenuBySlug<MenuItem>("header");
  const headerItems = [...defaultHeaderItems, ...(headerMenu?.items || [])];
  const { title } = getSiteConfig();

  return (
    <header className="relative w-full bg-card print:hidden border-b border-border">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">{title}</h1>
      </Link>
      <HeaderNav items={headerItems} extraNavItems={extraNavItems} />
    </header>
  );
}

interface SiteFooterProps {
  extraNavItems?: ReactNode;
}

async function SiteFooter({ extraNavItems }: SiteFooterProps) {
  const footerMenu = await getMenuBySlug<MenuItem>("footer");
  const footerItems = footerMenu?.items || defaultFooterItems;
  return (
    <footer className="w-full bg-card print:hidden border-t border-border">
      <FooterNav items={footerItems} extraNavItems={extraNavItems} />
    </footer>
  );
}

export interface AppLayoutProps {
  children: React.ReactNode;
  headerNavItems?: ReactNode;
  footerNavItems?: ReactNode;
}

export async function AppLayout({
  children,
  headerNavItems,
  footerNavItems,
}: AppLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background flex flex-col flex-nowrap items-center min-w-fit w-full">
        <AppProviders>
          <SiteHeader extraNavItems={headerNavItems} />
          {children}
          <SiteFooter extraNavItems={footerNavItems} />
        </AppProviders>
      </body>
    </html>
  );
}

export { SiteHeader, SiteFooter };
