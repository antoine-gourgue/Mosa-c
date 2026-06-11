"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { getRealtimeSocket } from "@/lib/realtime";

type NotificationsContextValue = {
  unreadCount: number;
  revision: number;
  clear: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue>({
  unreadCount: 0,
  revision: 0,
  clear: () => {},
});

/**
 * Provides the shared unread-notification state to the navigation bell badge and
 * the notifications panel. Seeds once from the server-rendered count, then is
 * managed on the client: a realtime `notification:new` event lights the badge
 * (and bumps a revision the open panel watches to refetch), and {@link clear}
 * resets it when the user opens the panel or the notifications page. Not
 * re-seeded from the prop, so opening the panel reliably clears the badge.
 *
 * @param props - The initial unread count and the wrapped subtree.
 * @returns The provider element.
 */
export function NotificationsProvider({
  initialUnreadCount,
  children,
}: {
  initialUnreadCount: number;
  children: ReactNode;
}): ReactElement {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onNew = (): void => {
      setUnreadCount((count) => count + 1);
      setRevision((value) => value + 1);
    };
    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, []);

  const clear = useCallback((): void => {
    setUnreadCount(0);
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({ unreadCount, revision, clear }),
    [unreadCount, revision, clear],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

/**
 * Reads the shared unread-notification state.
 *
 * @returns The live unread count, the refetch revision and the clear handler.
 */
export function useNotificationsUnread(): NotificationsContextValue {
  return useContext(NotificationsContext);
}
