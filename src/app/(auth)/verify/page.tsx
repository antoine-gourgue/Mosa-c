import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

/**
 * Metadata for the email verification route.
 */
export const metadata: Metadata = {
  title: "Verify your email",
};

/**
 * Email verification route. Reads the pending email from the query string and
 * renders the code-entry form inside the auth layout.
 *
 * @param props - The route's search params (the email to verify).
 * @returns The verification page.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; code?: string }>;
}): Promise<ReactElement> {
  const { email, code } = await searchParams;
  return (
    <AuthLayout>
      <VerifyEmail email={email ?? ""} initialCode={(code ?? "").replace(/\D/g, "").slice(0, 6)} />
    </AuthLayout>
  );
}
