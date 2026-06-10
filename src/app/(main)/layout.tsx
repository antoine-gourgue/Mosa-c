import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { EngagementProvider } from "@/components/engagement";
import { MessagesPanel, MessagesProvider } from "@/components/messages";
import { NotificationsPanel, NotificationsProvider } from "@/components/notifications";
import {
  BottomNav,
  ContentShell,
  Fab,
  NavPanelProvider,
  SideNav,
  TopNav,
} from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";
import {
  getCreatorById,
  getPendingFollowRequestCount,
  getUnreadConversationIds,
  getUnreadCount,
} from "@/server/services";

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
  const t = await getTranslations("common");
  const user = await getCurrentUser();
  const [profile, notifCount, pendingRequests, unreadConversationIds] = await Promise.all([
    user === null ? Promise.resolve(null) : getCreatorById(user.id),
    user === null ? Promise.resolve(0) : getUnreadCount(user.id),
    user === null ? Promise.resolve(0) : getPendingFollowRequestCount(user.id),
    user === null ? Promise.resolve<string[]>([]) : getUnreadConversationIds(user.id),
  ]);
  const unreadCount = notifCount + pendingRequests;
  const shell = (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
      >
        {t("skipToContent")}
      </a>
      {user !== null ? <SideNav /> : null}
      <ContentShell offset={user !== null}>
        <Suspense>
          <TopNav
            user={{
              name: profile?.name ?? user?.name ?? "You",
              image: profile?.avatarUrl ?? user?.image ?? null,
              username: profile?.username ?? null,
            }}
            isAuthed={user !== null}
          />
        </Suspense>
        <main id="main-content" tabIndex={-1} className="px-6 pb-24 pt-0 sm:pb-20">
          {children}
        </main>
      </ContentShell>
      {user !== null ? (
        <MessagesPanel
          viewerId={user.id}
          viewerName={profile?.name ?? user.name ?? "You"}
          viewerImage={profile?.avatarUrl ?? user.image ?? null}
        />
      ) : null}
      {user !== null ? <NotificationsPanel /> : null}
      {user !== null ? <Fab /> : null}
      {user !== null ? <BottomNav /> : null}
      {modal}
    </>
  );
  return (
    <ToastProvider>
      <EngagementProvider>
        {user !== null ? (
          <MessagesProvider viewerId={user.id} initialUnreadIds={unreadConversationIds}>
            <NotificationsProvider initialUnreadCount={unreadCount}>
              <NavPanelProvider>{shell}</NavPanelProvider>
            </NotificationsProvider>
          </MessagesProvider>
        ) : (
          shell
        )}
      </EngagementProvider>
    </ToastProvider>
  );
}
