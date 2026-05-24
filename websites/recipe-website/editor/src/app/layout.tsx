import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";
import { getSiteConfig } from "recipe-website-common/config/site";
import { auth, signIn, signOut } from "@/auth";

const { title, description } = getSiteConfig();

export const metadata: Metadata = {
  title,
  description,
};

const navLinkClassName =
  "appearance-none bg-transparent inline p-0 m-0 text-base font-normal cursor-pointer";

const navSpanClassName = "inline-block p-2 hover:underline";

async function SignInButton() {
  const session = await auth();
  return session ? (
    <form
      className="contents"
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button type="submit" className={navLinkClassName}>
        <span className={navSpanClassName}>Sign Out</span>
      </button>
    </form>
  ) : (
    <form
      className="contents"
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <button type="submit" className={navLinkClassName}>
        <span className={navSpanClassName}>Sign In</span>
      </button>
    </form>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout footerNavItems={<SignInButton />}>{children}</AppLayout>;
}
