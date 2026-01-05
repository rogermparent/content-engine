import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "recipe-website-common/components/AppLayout";
import { auth, signIn, signOut } from "@/auth";

export const metadata: Metadata = {
  title: "Recipe Editor",
  description: "A recipe book app built with Next 14.",
};

async function SignInButton({ className }: { className: string }) {
  const session = await auth();
  return session ? (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button className={className}>Sign Out</button>
    </form>
  ) : (
    <form
      action={async () => {
        "use server";
        await signIn();
      }}
    >
      <button className={className}>Sign In</button>
    </form>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayout
      footerNavItems={
        <SignInButton className="inline-block p-2 hover:underline cursor-pointer" />
      }
    >
      {children}
    </AppLayout>
  );
}
