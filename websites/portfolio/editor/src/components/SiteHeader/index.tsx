import Link from "next/link";
import getMenuBySlug from "menus-collection/controller/data/read";

export async function SiteHeader() {
  const menu = await getMenuBySlug("header");
  const menuItems = menu?.items;

  return (
    <header className="w-full bg-slate-800 print:hidden border-b border-slate-700">
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
