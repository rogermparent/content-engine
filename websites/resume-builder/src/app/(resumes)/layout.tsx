import type { Metadata } from "next";
import "@/app/globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Resume Builder",
  description: "A resume builder powered by LMDB and the filesystem.",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="w-full bg-slate-800 print:hidden">
        <Link href="/" className="block p-2">
          <h1 className="text-xl font-bold text-center">Resume Builder</h1>
        </Link>
      </header>
      {children}
      <footer className="w-full bg-slate-800 print:hidden">
        <nav className="flex flex-row flex-wrap justify-center">
          <Link href="/new-resume" className="inline-block p-2 hover:underline">
            New Resume
          </Link>
          <Link href="/settings" className="inline-block p-2 hover:underline">
            Settings
          </Link>
        </nav>
      </footer>
    </>
  );
}
