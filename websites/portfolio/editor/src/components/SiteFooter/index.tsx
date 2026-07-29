import Link from "next/link";
import { auth, signIn, signOut } from "@/auth";

export async function SiteFooter() {
  const session = await auth();
  return (
    <footer className="w-full border-t border-border bg-card print:hidden">
      <nav className="flex flex-row flex-wrap justify-center">
        <Link href="/" className="inline-block p-2 hover:underline">
          Home
        </Link>
        <Link href="/settings" className="inline-block p-2 hover:underline">
          Settings
        </Link>
        {session ? (
          <>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="w-full h-full block p-2 hover:underline">
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn();
            }}
          >
            <button className="w-full h-full block p-2 hover:underline">
              Sign In
            </button>
          </form>
        )}
      </nav>
    </footer>
  );
}
