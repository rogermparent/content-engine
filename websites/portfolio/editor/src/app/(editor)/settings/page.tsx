import { auth, signIn } from "@/auth";

export default async function SettingsPage() {
  const user = await auth();
  if (!user) {
    return signIn(undefined, {
      redirectTo: `/settings`,
    });
  }
  return (
    <main className="h-full w-full p-2 max-w-xl mx-auto grow">
      <h1>Settings</h1>
    </main>
  );
}
