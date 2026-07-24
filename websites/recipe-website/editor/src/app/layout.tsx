import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";
import { getSiteConfig } from "recipe-website-common/config/site";
import { Button } from "@discontent/component-library/components/ui/button";
import { auth, signIn, signOut } from "@/auth";

const { title, description } = getSiteConfig();

export const metadata: Metadata = {
  title,
  description,
};

async function SignInButton() {
  const session = await auth();
  return (
    <form
      className="contents"
      action={async () => {
        "use server";
        if (session) {
          await signOut();
        } else {
          await signIn();
        }
      }}
    >
      <Button type="submit" variant="ghost" size="sm">
        {session ? "Sign Out" : "Sign In"}
      </Button>
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
