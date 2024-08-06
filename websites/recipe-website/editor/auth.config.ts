import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const allowGuest = true;
      const isLoggedIn = !!auth?.user;
      if (allowGuest) {
        const isEditorPath = /\/(edit|copy|new-recipe)/.test(nextUrl.pathname);
        const isSettingsPath = nextUrl.pathname.startsWith("/settings");
        const isPrivilegedPath = isEditorPath || isSettingsPath;
        if (isPrivilegedPath) {
          if (isLoggedIn) return true;
          return false; // Redirect unauthenticated users to signIn page
        }
        return true;
      } else {
        return isLoggedIn;
      }
    },
  },
  providers: [],
} satisfies NextAuthConfig;
