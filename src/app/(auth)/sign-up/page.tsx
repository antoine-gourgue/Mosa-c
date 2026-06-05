import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignUp } from "@/components/auth/SignUp";

/**
 * Metadata for the sign-up route.
 */
export const metadata: Metadata = {
  title: "Sign up",
};

/**
 * Sign-up route rendering the auth layout and the sign-up form.
 *
 * @returns The sign-up page.
 */
export default function SignUpPage(): ReactElement {
  return (
    <AuthLayout>
      <SignUp />
    </AuthLayout>
  );
}
