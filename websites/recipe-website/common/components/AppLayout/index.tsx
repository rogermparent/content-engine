import Link from "next/link";
import getMenuBySlug from "@discontent/menus-collection/controller/data/read";
import { MenuItem } from "@discontent/menus-collection/controller/types";
import { ReactNode } from "react";
import { AppProviders } from "./AppProviders";
import { getSiteConfig } from "../../config/site";

const defaultFooterItems: MenuItem[] = [
  { name: "Search", href: "/search" },
  { name: "New Recipe", href: "/new-recipe" },
  { name: "Settings", href: "/settings" },
];

function DefaultHeaderLink({ item }: { item: MenuItem }) {
  const { name, href } = item;
  return (
    <Link href={href} className="p-1 inline-block hover:underline">
      {name}
    </Link>
  );
}

function DefaultFooterLink({ item }: { item: MenuItem }) {
  const { name, href } = item;
  return (
    <Link href={href} className="inline-block p-2 hover:underline">
      {name}
    </Link>
  );
}

interface SiteHeaderProps {
  extraNavItems?: ReactNode;
}

async function SiteHeader({ extraNavItems }: SiteHeaderProps) {
  const headerMenu = await getMenuBySlug<MenuItem>("header");
  const headerItems = headerMenu?.items || [];
  const { title } = getSiteConfig();

  return (
    <header className="w-full bg-card print:hidden border-b border-border">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">{title}</h1>
      </Link>
      <nav className="text-center">
        <Link href="/bookmarks" className="p-1 inline-block hover:underline">
          Bookmarks
        </Link>
        {headerItems.map((item) => (
          <DefaultHeaderLink item={item} key={item.href} />
        ))}
        {extraNavItems}
      </nav>
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
      <nav className="flex flex-row flex-wrap justify-center">
        {footerItems.map((item) => (
          <DefaultFooterLink item={item} key={item.href} />
        ))}
        {extraNavItems}
      </nav>
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
