import "./globals.css";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import getMenuBySlug from "menus-collection/controller/data/read";
import { MenuItem } from "menus-collection/controller/types";
import { ReactNode } from "react";
import { Session } from "next-auth";

type SiteMenuItem = MenuItem | { type: "sign-in" };

interface SiteMenuItemProps {
  item: SiteMenuItem;
  session: Session | null;
}

const defaultFooterItems: SiteMenuItem[] = [
  { name: "Search", href: "/search" },
  { name: "New Recipe", href: "/new-recipe" },
  { name: "Settings", href: "/settings" },
  { type: "sign-in" },
];

const menuItemComponents: Record<
  NonNullable<SiteMenuItem["type"]>,
  (props: SiteMenuItemProps) => ReactNode
> = {
  "sign-in": SignInButton,
};

function DefaultHeaderLink({ item }: SiteMenuItemProps) {
  const { name, href } = item as MenuItem;
  return (
    <Link href={href} className="p-1 inline-block hover:underline">
      {name}
    </Link>
  );
}

function DefaultFooterLink({ item }: SiteMenuItemProps) {
  const { name, href } = item as MenuItem;
  return (
    <Link href={href} className="inline-block p-2 hover:underline">
      {name}
    </Link>
  );
}

function SignInButton({ session }: SiteMenuItemProps) {
  return session ? (
    <>
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <button className="w-full h-full block p-2 hover:underline">
          Sign Out
        </button>
      </form>
    </>
  ) : (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <button className="w-full h-full block p-2 hover:underline">
        Sign In
      </button>
    </form>
  );
}

export async function SiteHeader() {
  const session = await auth();
  const headerMenu = await getMenuBySlug<SiteMenuItem>("header");
  const headerItems = headerMenu?.items || [];

  return (
    <header className="w-full bg-slate-800 print:hidden border-b border-slate-700">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">Recipe Editor</h1>
      </Link>
      <nav className="text-center">
        {headerItems.map((headerMenuItem, i) => {
          const ItemComponent = headerMenuItem.type
            ? menuItemComponents[headerMenuItem.type]
            : DefaultHeaderLink;
          return (
            <ItemComponent item={headerMenuItem} session={session} key={i} />
          );
        })}
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const session = await auth();
  const footerMenu = await getMenuBySlug<SiteMenuItem>("footer");
  const footerItems = footerMenu?.items || defaultFooterItems;
  return (
    <footer className="w-full bg-slate-800 print:hidden border-t border-slate-700">
      <nav className="flex flex-row flex-wrap justify-center">
        {footerItems.map((footerMenuItem, i) => {
          const ItemComponent = footerMenuItem.type
            ? menuItemComponents[footerMenuItem.type]
            : DefaultFooterLink;
          return (
            <ItemComponent item={footerMenuItem} session={session} key={i} />
          );
        })}
      </nav>
    </footer>
  );
}
