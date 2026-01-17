import Link from "next/link";
import getMenuBySlug from "menus-collection/controller/data/read";
import { MenuItem } from "menus-collection/controller/types";
import { ReactNode } from "react";
import { AppProviders } from "./AppProviders";

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

  return (
    <header className="w-full bg-slate-800 print:hidden border-b border-slate-700">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">Recipe Editor</h1>
      </Link>
      <nav className="text-center">
        <Link href="/bookmarks" className="p-1 inline-block hover:underline">
          Bookmarks
        </Link>
        {headerItems.map((item, i) => (
          <DefaultHeaderLink item={item} key={i} />
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
    <footer className="w-full bg-slate-800 print:hidden border-t border-slate-700">
      <nav className="flex flex-row flex-wrap justify-center">
        {footerItems.map((item, i) => (
          <DefaultFooterLink item={item} key={i} />
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
    <html lang="en">
      <body className="bg-slate-950 flex flex-col flex-nowrap items-center min-w-fit w-full">
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
