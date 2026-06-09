"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactElement, ReactNode } from "react";
import { getRealtimeSocket } from "@/lib/realtime";

type MessagesContextValue = {
  unreadCount: number;
  markRead: (conversationId: string) => void;
  addUnread: (conversationId: string) => void;
  inboxRevision: number;
  refreshInbox: () => void;
};

const MessagesContext = createContext<MessagesContextValue>({
  unreadCount: 0,
  markRead: () => {},
  addUnread: () => {},
  inboxRevision: 0,
  refreshInbox: () => {},
});

/**
 * Provides the shared unread-messages state to the navigation badge and the
 * inbox. Seeds from the conversations that already have unread messages and
 * subscribes to the realtime socket so an incoming message from someone else
 * lights up the badge live. The inbox clears a conversation as it is read.
 *
 * @param props - The viewer id, the initially unread conversation ids and the
 *   wrapped subtree.
 * @returns The provider element.
 */
export function MessagesProvider({
  viewerId,
  initialUnreadIds,
  children,
}: {
  viewerId: string;
  initialUnreadIds: string[];
  children: ReactNode;
}): ReactElement {
  const [unread, setUnread] = useState<Set<string>>(() => new Set(initialUnreadIds));
  const [inboxRevision, setInboxRevision] = useState(0);

  const refreshInbox = useCallback((): void => {
    setInboxRevision((revision) => revision + 1);
  }, []);

  const addUnread = useCallback((conversationId: string): void => {
    setUnread((prev) => (prev.has(conversationId) ? prev : new Set(prev).add(conversationId)));
  }, []);

  const markRead = useCallback((conversationId: string): void => {
    setUnread((prev) => {
      if (!prev.has(conversationId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onMessageNew = (message: { conversationId: string; senderId: string }): void => {
      if (message.senderId !== viewerId) {
        addUnread(message.conversationId);
      }
    };
    const onInboxRefresh = (): void => {
      refreshInbox();
    };
    socket.on("message:new", onMessageNew);
    socket.on("inbox:refresh", onInboxRefresh);
    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("inbox:refresh", onInboxRefresh);
    };
  }, [viewerId, addUnread, refreshInbox]);

  const value = useMemo<MessagesContextValue>(
    () => ({ unreadCount: unread.size, markRead, addUnread, inboxRevision, refreshInbox }),
    [unread, markRead, addUnread, inboxRevision, refreshInbox],
  );

  return <MessagesContext.Provider value={value}>{children}</MessagesContext.Provider>;
}

/**
 * Reads the shared unread-messages state.
 *
 * @returns The unread count and the read/unread setters.
 */
export function useMessagesUnread(): MessagesContextValue {
  return useContext(MessagesContext);
}
