import { Suspense } from "react";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { EngagementProvider } from "@/components/engagement";
import { MessagesProvider } from "@/components/messages";
import { BottomNav, Fab, TopNav } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorById, getUnreadConversationIds, getUnreadCount } from "@/server/services";

/**
 * Authenticated application shell wrapping every main route with the sticky top
 * navigation, the toast host, page padding and the parallel modal slot used by
 * the pin detail overlay.
 *
 * @param props - Layout props.
 * @param props.children - The routed page content.
 * @param props.modal - The parallel `@modal` slot (pin detail overlay).
 * @returns The main layout element.
 */
export default async function MainLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  const [profile, unreadCount, unreadConversationIds] = await Promise.all([
    user === null ? Promise.resolve(null) : getCreatorById(user.id),
    user === null ? Promise.resolve(0) : getUnreadCount(user.id),
    user === null ? Promise.resolve<string[]>([]) : getUnreadConversationIds(user.id),
  ]);
  const shell = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
      >
        Skip to content
      </a>
      <Suspense>
        <TopNav
          user={{
            name: profile?.name ?? user?.name ?? "You",
            image: profile?.avatarUrl ?? user?.image ?? null,
            username: profile?.username ?? null,
          }}
          unreadCount={unreadCount}
          isAuthed={user !== null}
        />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="px-6 pb-24 pt-4 sm:pb-20">
        {children}
      </main>
      {user !== null ? <Fab /> : null}
      {user !== null ? <BottomNav unreadCount={unreadCount} /> : null}
      {modal}
    </>
  );
  return (
    <ToastProvider>
      <EngagementProvider>
        {user !== null ? (
          <MessagesProvider viewerId={user.id} initialUnreadIds={unreadConversationIds}>
            {shell}
          </MessagesProvider>
        ) : (
          shell
        )}
      </EngagementProvider>
    </ToastProvider>
  );
}
