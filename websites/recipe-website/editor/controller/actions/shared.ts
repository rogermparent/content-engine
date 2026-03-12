import { auth } from "@/auth";

export async function authenticateUser(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }
  return session.user.email;
}
