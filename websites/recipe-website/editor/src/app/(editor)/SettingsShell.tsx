"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SettingsSidebar, SettingsMobileNav } from "./SettingsSidebar";

/**
 * The (editor) route group also serves the public catch-all pages (e.g.
 * `/about`) and the menu/page edit forms. The settings shell should wrap only
 * the settings *areas*, so gate on the path: these prefixes are the settings
 * areas; anything else (a public page) renders bare.
 */
const SETTINGS_PREFIXES = ["/settings", "/git", "/export", "/menus", "/pages"];

function inSettings(pathname: string): boolean {
  return SETTINGS_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Two-pane settings shell (PR 14): a persistent instrument-rack sidebar (a
 * mobile drawer below `lg`) beside the area's content. Replaces the old
 * `bg-slate-800` sub-footer. Centered to `max-w-6xl` like the masthead + footer.
 */
export function SettingsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (!inSettings(pathname)) return <>{children}</>;
  return (
    // lg:items-start keeps the main column at its content height (stretching it
    // to the sidebar's height would cap it, so tall editor content overflowed and
    // the footer overlapped it); the aside stretches on its own via self-stretch.
    <div className="mx-auto flex w-full max-w-6xl grow flex-col lg:flex-row lg:items-start">
      <SettingsSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SettingsMobileNav />
        {children}
      </div>
    </div>
  );
}
