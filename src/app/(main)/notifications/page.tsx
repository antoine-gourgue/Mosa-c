import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { NotificationsInbox } from "@/components/notifications";
import { getCurrentUser } from "@/lib/auth";
import { getNotifications } from "@/server/services";

/**
 * Metadata for the notifications route.
 */
export const metadata: Metadata = {
  title: "Notifications",
};

/**
 * Notifications inbox route, listing the current user's notifications.
 *
 * @returns The notifications page.
 */
export default async function NotificationsPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const items = await getNotifications(user.id);
  return <NotificationsInbox items={items} />;
}
