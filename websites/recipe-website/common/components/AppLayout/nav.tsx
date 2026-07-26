"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentType, ReactNode, useState } from "react";
import { BookmarkIcon, MenuIcon, SearchIcon } from "lucide-react";
import { cn } from "@discontent/component-library/lib/utils";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@discontent/component-library/components/ui/sheet";
import { MenuItem } from "@discontent/menus-collection/controller/types";
import { AppearanceControls, AppearanceMenu } from "./Appearance";

/**
 * Leading glyphs for well-known destinations, keyed by href. Lets the masthead
 * give Bookmarks / Search the conventional recipe-site icon+label treatment
 * without threading icon data through the menus collection.
 */
const NAV_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "/bookmarks": BookmarkIcon,
  "/search": SearchIcon,
};

/**
 * A navigation link that marks itself current when the path matches, so screen
 * readers and styling can reflect the active page. Internal to this module so
 * its function prop never crosses the server/client boundary.
 */
function NavLink({
  item,
  className,
  onNavigate,
}: {
  item: MenuItem;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = NAV_ICONS[item.href];
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md hover:text-primary aria-[current=page]:font-semibold aria-[current=page]:text-primary",
        className,
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0" /> : null}
      {item.name}
    </Link>
  );
}

/**
 * The masthead's right cluster: destination links (Bookmarks, Search, plus any
 * menu-configured items) followed by owner passthrough content and the single
 * Appearance control. `/search` is always present here even though it also
 * lives in the footer — it's a primary destination on a recipe site.
 */
function rightItems(items: MenuItem[]): MenuItem[] {
  const withSearch = items.some((i) => i.href === "/search")
    ? items
    : [...items, { name: "Search", href: "/search" }];
  return withSearch;
}

/**
 * Header navigation: a single inline row on desktop (wordmark lives in the
 * server SiteHeader beside this), a Sheet drawer on small screens.
 * `extraNavItems` is server-rendered content (e.g. auth buttons) passed through.
 */
export function HeaderNav({
  items,
  extraNavItems,
}: {
  items: MenuItem[];
  extraNavItems?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const links = rightItems(items);

  return (
    <>
      <nav className="hidden items-center gap-1 text-sm sm:flex">
        {links.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            className="px-2 py-1.5 font-medium"
          />
        ))}
        {extraNavItems}
        <AppearanceMenu className="ml-1" />
      </nav>

      <div className="sm:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-4">
            <SheetTitle className="mb-2">Menu</SheetTitle>
            <nav className="flex flex-col gap-1 text-lg">
              {links.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  className="p-2"
                  onNavigate={close}
                />
              ))}
              {extraNavItems}
              <div className="mt-3 border-t border-border pt-3">
                <AppearanceControls />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

/**
 * Footer navigation: a wrapping row of links with active-state marking.
 */
export function FooterNav({
  items,
  extraNavItems,
}: {
  items: MenuItem[];
  extraNavItems?: ReactNode;
}) {
  return (
    <nav className="flex flex-row flex-wrap justify-center">
      {items.map((item) => (
        <NavLink key={item.href} item={item} className="inline-block p-2" />
      ))}
      {extraNavItems}
    </nav>
  );
}
