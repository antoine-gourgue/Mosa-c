import type { NextAuthConfig } from "next-auth";

const AUTH_ROUTES = new Set(["/login", "/sign-up"]);
const PUBLIC_EXACT = new Set(["/"]);
const PUBLIC_PREFIXES = ["/styleguide", "/pin/", "/u/"];

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
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = auth?.user != null;
      const { pathname } = request.nextUrl;
      if (AUTH_ROUTES.has(pathname)) {
        return isLoggedIn ? Response.redirect(new URL("/", request.nextUrl)) : true;
      }
      if (PUBLIC_EXACT.has(pathname)) {
        return true;
      }
      if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
        return true;
      }
      if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
          return false;
        }
        return auth?.user?.role === "ADMIN"
          ? true
          : Response.redirect(new URL("/", request.nextUrl));
      }
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id !== undefined) {
        token.id = user.id;
      }
      if (user?.role !== undefined) {
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      return session;
    },
  },
} satisfies NextAuthConfig;
