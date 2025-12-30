import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "../auth.config";
import { z } from "zod";
import { readJson } from "fs-extra";
import { resolve } from "path";
import bcrypt from "bcrypt";
import { getContentDirectory } from "content-engine/fs/getContentDirectory";

export interface User {
  email: string;
  password: string;
}

async function getUser(email: string): Promise<User | undefined> {
  try {
    return readJson(resolve(getContentDirectory(), "users", email));
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            return user;
          }
        }

        return null;
      },
    }),
  ],
});
