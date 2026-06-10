import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword } from "@/components/auth/ForgotPassword";

/**
 * Metadata for the forgot-password route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("forgotPassword"),
    robots: { index: false },
  };
}

/**
 * Forgot-password route: request a reset link by email.
 *
 * @returns The forgot-password page.
 */
export default function ForgotPasswordPage(): ReactElement {
  return (
    <AuthLayout>
      <ForgotPassword />
    </AuthLayout>
  );
}
