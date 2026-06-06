import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/password";
import { signInSchema } from "@/lib/validation/auth";
import { authConfig } from "@/lib/auth.config";
import { ensureUserSetup } from "@/server/onboarding";

const credentialsProvider = Credentials({
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials) {
    const parsed = signInSchema.safeParse(credentials);
    if (!parsed.success) {
      return null;
    }
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (user === null || user.passwordHash === null || user.disabled) {
      return null;
    }
    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return null;
    }
    return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
  },
});

const providers: Provider[] = [credentialsProvider];

if (env.GOOGLE_CLIENT_ID !== undefined && env.GOOGLE_CLIENT_SECRET !== undefined) {
  providers.push(
    Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }),
  );
}

if (env.APPLE_CLIENT_ID !== undefined && env.APPLE_CLIENT_SECRET !== undefined) {
  providers.push(Apple({ clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET }));
}

/**
 * Auth.js entry points for the application. Extends the edge-safe config with
 * the Prisma adapter and the real providers. Google and Apple are enabled only
 * when their credentials are present, so the app runs without them.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers,
  events: {
    async signIn({ user }) {
      if (typeof user.id === "string") {
        await ensureUserSetup(user.id);
      }
    },
  },
});

/**
 * Returns the currently authenticated session user, or null when signed out.
 * Use this from server components and actions.
 *
 * @returns The session user or null.
 */
export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Authorizes an admin-only server context. Redirects unauthenticated visitors
 * to the login page and non-admins to the home feed. The role is re-checked
 * against the database (the source of truth), so it stays authoritative even if
 * a session token is stale.
 *
 * @returns The authenticated admin session user.
 */
export async function requireAdmin(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });
  if (record === null || record.role !== "ADMIN") {
    redirect("/");
  }
  return user;
}
