"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@discontent/component-library/components/ui/sheet";

export interface SidebarLayoutProps {
  /** aria-label on the aside, the mobile trigger text, and the sr-only title. */
  label: string;
  /** Nav content, rendered in both the desktop aside and the mobile drawer. */
  sidebar: ReactNode;
  children: ReactNode;
}

/**
 * Reusable two-pane section layout: a full-bleed instrument-rack sidebar (a
 * mobile `ui/sheet` drawer below `lg`) beside a wide content column. The outer
 * `w-full` overrides the body's `items-center`, so the aside's panel + border
 * reach the left screen edge while the header/footer stay centered.
 *
 * The `sidebar` node stays decoupled — it needs no `onNavigate` prop because the
 * drawer auto-closes here on pathname change. `lg:items-start` keeps the main
 * column at its content height so tall content doesn't get capped to the aside's
 * height (which would let the sticky footer overlap it).
 */
export function SidebarLayout({
  label,
  sidebar,
  children,
}: SidebarLayoutProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close the mobile drawer whenever the route changes, so a nav link click
  // dismisses it without the sidebar content needing to know about the drawer.
  // Adjusting state during render (the React-recommended pattern for resetting
  // state on a prop change) instead of an effect — no cascading-render lint, and
  // the drawer is closed in the same pass the new pathname renders.
  const [drawerPath, setDrawerPath] = useState(pathname);
  if (pathname !== drawerPath) {
    setDrawerPath(pathname);
    setOpen(false);
  }

  return (
    <div className="flex w-full grow flex-col lg:flex-row lg:items-start">
      {/* Below lg, the aside collapses into a labeled drawer trigger. */}
      <div className="border-b border-border bg-card px-3 py-2 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Menu className="size-4" />
              {label} menu
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetTitle className="sr-only">{label} navigation</SheetTitle>
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>

      <aside
        aria-label={label}
        className="hidden w-56 shrink-0 self-stretch border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block"
      >
        <div className="sticky top-[var(--header-height)]">{sidebar}</div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
