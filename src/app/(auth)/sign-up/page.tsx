import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignUp } from "@/components/auth/SignUp";

/**
 * Metadata for the sign-up route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("signUp"),
  };
}

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
