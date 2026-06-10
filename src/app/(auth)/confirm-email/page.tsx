import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ConfirmEmail } from "@/components/auth/ConfirmEmail";

/**
 * Metadata for the email-confirmation route.
 */
export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false },
};

/**
 * Email-change confirmation route. Applies the change from the link token.
 *
 * @param props - The route's search params (the confirmation token).
 * @returns The confirmation page.
 */
export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<ReactElement> {
  const { token } = await searchParams;
  const resolvedToken = Array.isArray(token) ? (token[0] ?? "") : (token ?? "");
  return (
    <AuthLayout>
      <ConfirmEmail token={resolvedToken} />
    </AuthLayout>
  );
}
