"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentType, useState } from "react";
import {
  SlidersHorizontal,
  Palette,
  ListTree,
  FileText,
  FolderSync,
  Download,
  ArrowLeft,
  LogOut,
  Settings2,
} from "lucide-react";
import { cn } from "@discontent/component-library/lib/utils";
import { Button } from "@discontent/component-library/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@discontent/component-library/components/ui/sheet";
import { signOutAction } from "./settings/actions";

interface NavItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

/**
 * The settings areas, grouped as an "instrument rack" (PR 14). Each area is its
 * own page; the old dark sub-footer that linked them is gone.
 */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Setup",
    items: [
      { name: "General", href: "/settings", icon: SlidersHorizontal },
      { name: "Appearance", href: "/settings/theme", icon: Palette },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Navigation", href: "/menus", icon: ListTree },
      { name: "Pages", href: "/pages", icon: FileText },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Content Sync", href: "/git", icon: FolderSync },
      { name: "Export", href: "/export", icon: Download },
    ],
  },
];

/**
 * `/settings` must only be active on its exact path (otherwise it would also
 * light up on `/settings/theme`); every other area matches its path or any
 * nested route (e.g. `/menus/edit/...` keeps Navigation active).
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/settings") return pathname === "/settings";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const labelClass =
  "px-3 font-mono text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground";
const rowClass =
  "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60";

/** Shared nav body used by both the desktop aside and the mobile drawer. */
function SettingsNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col py-4">
      <p className={cn(labelClass, "mb-4")}>Settings</p>
      <nav className="flex-1 space-y-6 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className={labelClass}>{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      rowClass,
                      active &&
                        "border-primary bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-6 space-y-0.5 border-t border-sidebar-border px-2 pt-3">
        <Link href="/" onClick={onNavigate} className={rowClass}>
          <ArrowLeft className="size-4 shrink-0" />
          Back to site
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={cn(rowClass, "w-full text-left")}>
            <LogOut className="size-4 shrink-0" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}

/** Persistent settings sidebar, shown from `lg` up. */
export function SettingsSidebar() {
  return (
    <aside
      aria-label="Settings"
      className="hidden w-56 shrink-0 self-stretch border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block"
    >
      <div className="sticky top-[var(--header-height)]">
        <SettingsNav />
      </div>
    </aside>
  );
}

/** Below `lg`, the sidebar collapses into a labeled drawer (a ui/sheet). */
export function SettingsMobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border bg-card px-3 py-2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings2 className="size-4" />
            Settings menu
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-64 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Settings navigation</SheetTitle>
          <SettingsNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
