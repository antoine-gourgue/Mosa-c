import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { EditProfile } from "@/components/profile/EditProfile";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorById } from "@/server/services";

/**
 * Metadata for the edit-profile route.
 */
export const metadata: Metadata = {
  title: "Edit profile",
};

/**
 * Edit-profile route, pre-filled with the current user's details.
 *
 * @returns The edit profile page.
 */
export default async function EditProfilePage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const profile = await getCreatorById(user.id);
  return (
    <EditProfile
      name={profile?.name ?? user.name ?? ""}
      bio={profile?.bio ?? ""}
      avatarUrl={profile?.avatarUrl ?? null}
    />
  );
}
