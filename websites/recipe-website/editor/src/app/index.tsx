import "./globals.css";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import getMenuBySlug from "menus-collection/controller/data/read";
import { MenuItem } from "menus-collection/controller/types";
import { ReactNode } from "react";
import { Session } from "next-auth";

interface SignInButtonMenuItem {
  type: "sign-in";
  signInText?: string;
  signOutText?: string;
}

type SiteMenuItem = MenuItem | SignInButtonMenuItem;

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

const headerMenuItemComponents: Record<
  NonNullable<SiteMenuItem["type"]>,
  (props: SiteMenuItemProps) => ReactNode
> = {
  "sign-in": ({ item, session }) => (
    <SignInButton
      item={item}
      session={session}
      className="p-1 inline-block hover:underline cursor-pointer"
    />
  ),
};

const footerMenuItemComponents: Record<
  NonNullable<SiteMenuItem["type"]>,
  (props: SiteMenuItemProps) => ReactNode
> = {
  "sign-in": ({ item, session }) => (
    <SignInButton
      item={item}
      session={session}
      className="inline-block p-2 hover:underline cursor-pointer"
    />
  ),
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

function SignInButton({
  session,
  item,
  className = "inline-block p-2 hover:underline cursor-pointer",
}: SiteMenuItemProps & { className?: string }) {
  const { signInText = "Sign In", signOutText = "Sign Out" } =
    item as SignInButtonMenuItem;
  return session ? (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button className={className}>{signOutText}</button>
    </form>
  ) : (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <button className={className}>{signInText}</button>
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
        <Link href="/bookmarks" className="p-1 inline-block hover:underline">
          Bookmarks
        </Link>
        {headerItems.map((headerMenuItem, i) => {
          const ItemComponent = headerMenuItem.type
            ? headerMenuItemComponents[headerMenuItem.type]
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
            ? footerMenuItemComponents[footerMenuItem.type]
            : DefaultFooterLink;
          return (
            <ItemComponent item={footerMenuItem} session={session} key={i} />
          );
        })}
      </nav>
    </footer>
  );
}
