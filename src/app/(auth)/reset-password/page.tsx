import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPassword } from "@/components/auth/ResetPassword";

/**
 * Metadata for the reset-password route.
 */
export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false },
};

/**
 * Reset-password route reached from the emailed link.
 *
 * @param props - The route's search params (the reset token).
 * @returns The reset page.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}): Promise<ReactElement> {
  const { token } = await searchParams;
  const resolvedToken = Array.isArray(token) ? (token[0] ?? "") : (token ?? "");
  return (
    <AuthLayout>
      <ResetPassword token={resolvedToken} />
    </AuthLayout>
  );
}
