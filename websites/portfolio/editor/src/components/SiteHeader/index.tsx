import Link from "next/link";
import getMenuBySlug from "@discontent/menus-collection/controller/data/read";

export async function SiteHeader() {
  const menu = await getMenuBySlug("header");
  const menuItems = menu?.items;

  return (
    <header className="w-full border-b border-border bg-card print:hidden">
      <Link href="/" className="block p-2">
        <h1 className="text-xl font-bold text-center">Portfolio</h1>
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
