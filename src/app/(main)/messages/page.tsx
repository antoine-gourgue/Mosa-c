import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";
import { Messenger } from "@/components/messages";
import { getCurrentUser } from "@/lib/auth";
import { getConversations, getMessageRequests, getMessages } from "@/server/services";

/**
 * Metadata for the messages route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("messages"),
    robots: { index: false },
  };
}

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
  const [conversations, requests] = await Promise.all([
    getConversations(user.id),
    getMessageRequests(user.id),
  ]);
  const known = [...conversations, ...requests].some((item) => item.id === c);
  const initialId = c !== undefined && known ? c : undefined;
  const initialMessages =
    initialId === undefined ? [] : ((await getMessages(initialId, user.id)) ?? []);

  return (
    <div className="-mx-6 -mb-24 -mt-4 sm:-mb-20">
      <Messenger
        conversations={conversations}
        requests={requests}
        viewerId={user.id}
        viewerName={user.name ?? "You"}
        initialConversationId={initialId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
