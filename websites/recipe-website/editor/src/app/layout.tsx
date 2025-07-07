import type { Metadata } from "next";
import "./globals.css";
import clsx from "clsx";
import { SiteFooter, SiteHeader } from ".";

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
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
