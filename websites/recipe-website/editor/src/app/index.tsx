import "./globals.css";
import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";
import getMenuBySlug from "menus-collection/controller/data/read";

export async function SiteHeader() {
  const menu = await getMenuBySlug("header");
  const menuItems = menu?.items;

  return (
    <header className="w-full bg-slate-800 print:hidden border-b border-slate-700">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">Recipe Editor</h1>
      </Link>
      <nav className="text-center">
        {menuItems?.map(({ href, name }) => {
          return (
            <Link
              key={href}
              href={href}
              className="p-1 inline-block hover:underline"
            >
              {name}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const session = await auth();
  const footerMenu = await getMenuBySlug("footer");
  return (
    <footer className="w-full bg-slate-800 print:hidden border-t border-slate-700">
      <nav className="flex flex-row flex-wrap justify-center">
        {footerMenu?.items
          ? footerMenu.items.map(({ name, href }) => (
              <Link
                key={`${name}-${href}`}
                href={href}
                className="inline-block p-2 hover:underline"
              >
                {name}
              </Link>
            ))
          : null}
        <Link href="/new-recipe" className="inline-block p-2 hover:underline">
          New Recipe
        </Link>
        <Link href="/settings" className="inline-block p-2 hover:underline">
          Settings
        </Link>
        {session ? (
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
        )}
      </nav>
    </footer>
  );
}
