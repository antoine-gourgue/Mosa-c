import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPassword } from "@/components/auth/ForgotPassword";

/**
 * Metadata for the forgot-password route.
 */
export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false },
};

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
