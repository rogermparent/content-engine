"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useState } from "react";
import { MenuIcon } from "lucide-react";
import { cn } from "@discontent/component-library/lib/utils";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@discontent/component-library/components/ui/sheet";
import { MenuItem } from "@discontent/menus-collection/controller/types";

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
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        "hover:underline aria-[current=page]:underline aria-[current=page]:font-semibold",
        className,
      )}
    >
      {item.name}
    </Link>
  );
}

/**
 * Header navigation: inline links on desktop, a Sheet drawer on small screens.
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

  return (
    <>
      <nav className="hidden sm:block text-center">
        {items.map((item) => (
          <NavLink key={item.href} item={item} className="p-1 inline-block" />
        ))}
        {extraNavItems}
      </nav>

      <div className="sm:hidden absolute right-1 top-1">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-4">
            <SheetTitle className="mb-2">Menu</SheetTitle>
            <nav className="flex flex-col gap-1 text-lg">
              {items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  className="p-2 block"
                  onNavigate={close}
                />
              ))}
              {extraNavItems}
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
