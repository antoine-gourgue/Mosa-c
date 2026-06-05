import type { NextAuthConfig } from "next-auth";

const AUTH_ROUTES = new Set(["/login", "/sign-up"]);
const PUBLIC_PREFIXES = ["/styleguide"];

/**
 * Edge-safe Auth.js configuration shared between the Node runtime config and the
 * middleware. It contains no database or Node-only dependencies, so it can run
 * in the middleware (Edge) runtime. The `authorized` callback gates access:
 * unauthenticated users are redirected to login, and authenticated users are
 * redirected away from the auth pages.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = auth?.user != null;
      const { pathname } = request.nextUrl;
      if (AUTH_ROUTES.has(pathname)) {
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }
      if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id !== undefined) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
