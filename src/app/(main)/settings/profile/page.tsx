import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { EditProfile } from "@/components/profile/EditProfile";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Metadata for the account settings route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("settings"),
    robots: { index: false },
  };
}

/**
 * Account settings route, pre-filled with the current user's details.
 *
 * @returns The settings page.
 */
export default async function EditProfilePage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      username: true,
      bio: true,
      avatarUrl: true,
      email: true,
      emailVerified: true,
      gender: true,
      passwordHash: true,
    },
  });
  if (profile === null) {
    redirect("/login");
  }
  return (
    <EditProfile
      name={profile.name ?? ""}
      username={profile.username ?? ""}
      bio={profile.bio ?? ""}
      avatarUrl={profile.avatarUrl ?? null}
      email={profile.email}
      emailVerified={profile.emailVerified != null}
      gender={profile.gender ?? null}
      hasPassword={profile.passwordHash != null}
    />
  );
}
