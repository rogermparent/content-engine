import HomePage from "portfolio-website-common/components/Homepage";
import Link from "next/link";

export { generateMetadata } from "portfolio-website-common/components/Homepage";

export default function EditorHomePage() {
  return (
    <>
      <HomePage />
      <footer className="w-full border-t border-border bg-card print:hidden">
        <nav className="flex flex-row flex-wrap justify-center">
          <Link href="/homepage" className="p-2">
            Edit Homepage
          </Link>
        </nav>
      </footer>
    </>
  );
}
