import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Messenger } from "@/components/messages";
import { getCurrentUser } from "@/lib/auth";
import { getConversations } from "@/server/services";

/**
 * Metadata for the messages route.
 */
export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false },
};

/**
 * Direct messages route: the current user's conversations and the active chat.
 *
 * @returns The messages page.
 */
export default async function MessagesPage(): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const conversations = await getConversations(user.id);
  return (
    <div className="mx-auto max-w-5xl">
      <Messenger conversations={conversations} viewerId={user.id} />
    </div>
  );
}
