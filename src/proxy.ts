import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

/**
 * Limits the proxy to application routes, skipping API routes, Next.js
 * internals and static assets.
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|uploads|brand).*)"],
};
