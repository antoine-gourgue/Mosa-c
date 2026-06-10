import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Login } from "@/components/auth/Login";

/**
 * Metadata for the login route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("login"),
  };
}

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
