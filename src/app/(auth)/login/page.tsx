import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Login } from "@/components/auth/Login";

/**
 * Metadata for the login route.
 */
export const metadata: Metadata = {
  title: "Log in",
};

/**
 * Login route rendering the auth layout and the login form.
 *
 * @returns The login page.
 */
export default function LoginPage(): ReactElement {
  return (
    <AuthLayout>
      <Login />
    </AuthLayout>
  );
}
