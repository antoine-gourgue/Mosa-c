import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { ReactElement } from "react";
import { Messenger } from "@/components/messages";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, getMessages } from "@/server/services";

/**
 * Metadata for the messages route.
 */
export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false },
};

/**
 * Direct messages route: the current user's conversations and the active chat.
 * A `c` query parameter (e.g. from a profile's Message button) opens that
 * conversation directly with its messages preloaded.
 *
 * @param props - Route props.
 * @param props.searchParams - The resolved URL search params.
 * @returns The messages page.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect("/login");
  }
  const { c } = await searchParams;
  const conversations = await getConversations(user.id);
  const initialId = c !== undefined && conversations.some((item) => item.id === c) ? c : undefined;
  const initialMessages =
    initialId === undefined ? [] : ((await getMessages(initialId, user.id)) ?? []);

  return (
    <div className="mx-auto max-w-5xl">
      <Messenger
        conversations={conversations}
        viewerId={user.id}
        initialConversationId={initialId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
