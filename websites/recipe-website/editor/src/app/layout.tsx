import type { Metadata } from "next";
import "./globals.css";
import clsx from "clsx";
import { SiteFooter, SiteHeader } from ".";
import { BookmarksProvider } from "recipe-website-common/context/BookmarksContext";

export const metadata: Metadata = {
  title: "Recipe Editor",
  description: "A recipe book app built with Next 14.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={clsx(
          "bg-slate-950 flex flex-col flex-nowrap items-center min-w-fit w-full",
        )}
      >
        <BookmarksProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </BookmarksProvider>
      </body>
    </html>
  );
}
