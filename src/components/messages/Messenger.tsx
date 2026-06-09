"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent, PointerEvent, ReactElement } from "react";
import { Avatar, Button, Input, Menu } from "@/components/ui";
import { BackIcon, LogoutIcon, MoreIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { conversationName } from "@/lib/conversation";
import { getRealtimeSocket } from "@/lib/realtime";
import {
  formatClockTime,
  formatLastActive,
  formatMessageSeparator,
  formatRelativeTime,
  shouldSeparateMessages,
} from "@/lib/time";
import {
  acceptRequest,
  declineRequest,
  fetchMessages,
  leaveConversation,
  markConversationRead,
  sendMessage,
  uploadMessageImage,
} from "@/server/actions/messages";
import type { ChatMessage, ConversationSummary } from "@/types/domain";
import { AttachMenu } from "./AttachMenu";
import { ConversationAvatar } from "./ConversationAvatar";
import { MessageImage } from "./MessageImage";
import { MessagePin } from "./MessagePin";
import { useMessagesUnread } from "./MessagesProvider";

/**
 * Props for the {@link Messenger} component.
 */
export type MessengerProps = {
  conversations: ConversationSummary[];
  requests?: ConversationSummary[];
  viewerId: string;
  initialConversationId?: string;
  initialMessages?: ChatMessage[];
};

type SendResult = { ok: true; message: ChatMessage } | { ok: false };

const TYPING_THROTTLE_MS = 1500;
const TYPING_CLEAR_MS = 3000;

/**
 * Direct-messages inbox with live delivery: a conversation list on the left and
 * the selected conversation with a composer on the right. New messages and
 * typing indicators arrive over the realtime socket; sending goes over the
 * socket when connected (the server broadcasts to both sides) and falls back to
 * the message action otherwise. On mobile, one pane is shown at a time.
 *
 * @param props - The viewer's conversations and their user id.
 * @returns The messenger element.
 */
export function Messenger({
  conversations,
  requests = [],
  viewerId,
  initialConversationId,
  initialMessages = [],
}: MessengerProps): ReactElement {
  const router = useRouter();
  const { markRead: clearUnreadBadge } = useMessagesUnread();
  const [list, setList] = useState(() =>
    conversations.map((conversation) =>
      conversation.id === initialConversationId
        ? { ...conversation, unreadCount: 0 }
        : conversation,
    ),
  );
  const [requestList, setRequestList] = useState(requests);
  const [tab, setTab] = useState<"inbox" | "requests">(
    initialConversationId !== undefined && requests.some((r) => r.id === initialConversationId)
      ? "requests"
      : "inbox",
  );
  const [activeId, setActiveId] = useState<string | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [presence, setPresence] = useState<{
    userId: string;
    online: boolean;
    lastSeenAt: string | null;
  } | null>(null);
  const [dragX, setDragX] = useState(0);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const dragRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  useEffect(() => {
    if (initialConversationId !== undefined) {
      clearUnreadBadge(initialConversationId);
      void markConversationRead(initialConversationId);
    }
  }, [initialConversationId, clearUnreadBadge]);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 640px)");
    const redirectIfDesktop = (matches: boolean): void => {
      if (matches) {
        router.replace("/");
      }
    };
    redirectIfDesktop(query.matches);
    const onChange = (event: MediaQueryListEvent): void => redirectIfDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [router]);

  const active =
    list.find((conversation) => conversation.id === activeId) ??
    requestList.find((conversation) => conversation.id === activeId) ??
    null;
  const activeIsRequest = activeId !== null && requestList.some((r) => r.id === activeId);
  const otherId = active?.other.id ?? null;
  const presenceForOther = presence !== null && presence.userId === otherId ? presence : null;
  const otherOnline = presenceForOther?.online === true;
  const otherLastSeen =
    presenceForOther !== null && !presenceForOther.online ? presenceForOther.lastSeenAt : null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, otherTyping]);

  useEffect(() => {
    if (otherId === null) {
      return;
    }
    const socket = getRealtimeSocket();

    const onPresence = (payload: {
      userId: string;
      online: boolean;
      lastSeenAt: string | null;
    }): void => {
      if (payload.userId !== otherId) {
        return;
      }
      setPresence({ userId: otherId, online: payload.online, lastSeenAt: payload.lastSeenAt });
    };

    const fetchPresence = (): void => {
      socket.emit("presence:get", { userIds: [otherId] }, (response: unknown) => {
        const entries = (
          response as {
            presence?: { userId: string; online: boolean; lastSeenAt: string | null }[];
          }
        )?.presence;
        const entry = entries?.find((candidate) => candidate.userId === otherId);
        if (entry !== undefined) {
          setPresence({ userId: otherId, online: entry.online, lastSeenAt: entry.lastSeenAt });
        }
      });
    };

    socket.on("presence:update", onPresence);
    socket.on("connect", fetchPresence);
    if (socket.connected) {
      fetchPresence();
    }
    return () => {
      socket.off("presence:update", onPresence);
      socket.off("connect", fetchPresence);
    };
  }, [otherId]);

  useEffect(() => {
    const socket = getRealtimeSocket();

    const onMessageNew = (message: ChatMessage): void => {
      setList((current) => {
        if (!current.some((conversation) => conversation.id === message.conversationId)) {
          return current;
        }
        return current
          .map((conversation) =>
            conversation.id === message.conversationId
              ? {
                  ...conversation,
                  lastMessage: {
                    body: message.body,
                    createdAt: message.createdAt,
                    senderId: message.senderId,
                  },
                  updatedAt: message.createdAt,
                  unreadCount:
                    conversation.id === activeId || message.senderId === viewerId
                      ? conversation.unreadCount
                      : conversation.unreadCount + 1,
                }
              : conversation,
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });

      if (message.senderId === viewerId || message.conversationId !== activeId) {
        return;
      }
      setOtherTyping(false);
      setMessages((current) =>
        current.some((existing) => existing.id === message.id) ? current : [...current, message],
      );
      clearUnreadBadge(message.conversationId);
      void markConversationRead(message.conversationId);
    };

    const onTyping = (payload: {
      conversationId: string;
      userId: string;
      typing: boolean;
    }): void => {
      if (payload.userId === viewerId || payload.conversationId !== activeId) {
        return;
      }
      setOtherTyping(payload.typing);
      if (typingClearRef.current !== null) {
        clearTimeout(typingClearRef.current);
      }
      if (payload.typing) {
        typingClearRef.current = setTimeout(() => setOtherTyping(false), TYPING_CLEAR_MS);
      }
    };

    socket.on("message:new", onMessageNew);
    socket.on("typing", onTyping);
    return () => {
      socket.off("message:new", onMessageNew);
      socket.off("typing", onTyping);
    };
  }, [activeId, viewerId, clearUnreadBadge]);

  const openConversation = (id: string): void => {
    setActiveId(id);
    setMessages([]);
    setOtherTyping(false);
    setLoading(true);
    clearUnreadBadge(id);
    setList((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
    startTransition(async () => {
      const result = await fetchMessages(id);
      setLoading(false);
      if (result.ok) {
        setMessages(result.messages);
      }
    });
    void markConversationRead(id);
  };

  const onAcceptRequest = (): void => {
    if (activeId === null) {
      return;
    }
    const id = activeId;
    const summary = requestList.find((request) => request.id === id);
    startTransition(async () => {
      const result = await acceptRequest(id);
      if (result.ok) {
        setRequestList((current) => current.filter((request) => request.id !== id));
        if (summary !== undefined) {
          setList((current) =>
            current.some((conversation) => conversation.id === id)
              ? current
              : [summary, ...current],
          );
        }
        setTab("inbox");
      }
    });
  };

  const onDeclineRequest = (): void => {
    if (activeId === null) {
      return;
    }
    const id = activeId;
    startTransition(async () => {
      const result = await declineRequest(id);
      if (result.ok) {
        setRequestList((current) => current.filter((request) => request.id !== id));
        setActiveId(null);
        setTab("inbox");
      }
    });
  };

  const deliver = (
    conversationId: string,
    body: string,
    imageUrl: string | null = null,
  ): Promise<SendResult> => {
    const socket = getRealtimeSocket();
    if (socket.connected) {
      return new Promise<SendResult>((resolve) => {
        socket
          .timeout(5000)
          .emit(
            "message:send",
            { conversationId, body, imageUrl },
            (error: unknown, response: unknown) => {
              const ok =
                error === null &&
                typeof response === "object" &&
                response !== null &&
                (response as { ok?: unknown }).ok === true;
              if (ok) {
                resolve({ ok: true, message: (response as { message: ChatMessage }).message });
              } else {
                resolve({ ok: false });
              }
            },
          );
      });
    }
    return sendMessage(conversationId, body, null, imageUrl).then((result) =>
      result.ok ? { ok: true, message: result.message } : { ok: false },
    );
  };

  const sendImageUrl = (url: string): void => {
    if (activeId === null) {
      return;
    }
    const conversationId = activeId;
    const preview = /\.gif($|\?)/i.test(url) ? "Sent a GIF" : "Sent a photo";
    startTransition(async () => {
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        conversationId,
        senderId: viewerId,
        body: "",
        createdAt: new Date().toISOString(),
        pin: null,
        imageUrl: url,
      };
      setMessages((current) => [...current, optimistic]);
      const result = await deliver(conversationId, "", url);
      if (!result.ok) {
        setMessages((current) => current.filter((message) => message.id !== tempId));
        return;
      }
      const saved = result.message;
      setMessages((current) => {
        const withoutTemp = current.filter((message) => message.id !== tempId);
        return withoutTemp.some((message) => message.id === saved.id)
          ? withoutTemp
          : [...withoutTemp, saved];
      });
      setList((current) =>
        current
          .map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  lastMessage: {
                    body: preview,
                    createdAt: saved.createdAt,
                    senderId: viewerId,
                  },
                  updatedAt: saved.createdAt,
                }
              : conversation,
          )
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    });
  };

  const onAttachImage = (file: File): void => {
    const form = new FormData();
    form.set("image", file);
    void (async () => {
      const uploaded = await uploadMessageImage(form);
      if (uploaded.ok) {
        sendImageUrl(uploaded.url);
      }
    })();
  };

  const onSend = (): void => {
    const text = draft.trim();
    if (text === "" || activeId === null) {
      return;
    }
    const conversationId = activeId;
    setDraft("");
    emitTyping(false);
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const tempId = `temp-${now}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: viewerId,
      body: text,
      createdAt: new Date(now).toISOString(),
      pin: null,
      imageUrl: null,
    };
    setMessages((current) => [...current, optimistic]);
    startTransition(async () => {
      const result = await deliver(conversationId, text);
      if (result.ok) {
        const saved = result.message;
        setMessages((current) => {
          const withoutTemp = current.filter((message) => message.id !== tempId);
          return withoutTemp.some((message) => message.id === saved.id)
            ? withoutTemp
            : [...withoutTemp, saved];
        });
        setList((current) =>
          current
            .map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    lastMessage: {
                      body: saved.body,
                      createdAt: saved.createdAt,
                      senderId: viewerId,
                    },
                    updatedAt: saved.createdAt,
                  }
                : conversation,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      } else {
        setMessages((current) => current.filter((message) => message.id !== tempId));
      }
    });
  };

  const onLeaveGroup = (): void => {
    if (activeId === null) {
      return;
    }
    const id = activeId;
    setList((current) => current.filter((conversation) => conversation.id !== id));
    setActiveId(null);
    startTransition(async () => {
      await leaveConversation(id);
    });
  };

  const emitTyping = (typing: boolean): void => {
    if (activeId === null) {
      return;
    }
    const socket = getRealtimeSocket();
    if (!socket.connected) {
      return;
    }
    const now = Date.now();
    if (typing && now - lastTypingSentRef.current < TYPING_THROTTLE_MS) {
      return;
    }
    lastTypingSentRef.current = typing ? now : 0;
    socket.emit("typing", { conversationId: activeId, typing });
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  const onAreaPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    dragRef.current = { x: event.clientX, y: event.clientY, active: false };
  };

  const onAreaPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const start = dragRef.current;
    if (start === null) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.active) {
      if (dx < -8 && Math.abs(dx) > Math.abs(dy)) {
        start.active = true;
      } else if (Math.abs(dy) > 8) {
        dragRef.current = null;
        return;
      } else {
        return;
      }
    }
    setDragX(Math.max(-56, Math.min(0, dx)));
  };

  const onAreaPointerUp = (): void => {
    dragRef.current = null;
    setDragX(0);
  };

  const renderConversationRow = (conversation: ConversationSummary): ReactElement => (
    <li key={conversation.id}>
      <button
        type="button"
        onClick={() => openConversation(conversation.id)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
          conversation.id === activeId ? "bg-surface" : "",
        )}
      >
        <ConversationAvatar summary={conversation} size={44} />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">
              {conversationName(conversation)}
            </span>
            {conversation.lastMessage !== null ? (
              <span className="shrink-0 text-xs text-ink-faint">
                {formatRelativeTime(conversation.lastMessage.createdAt)}
              </span>
            ) : null}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] text-ink-soft">
              {conversation.lastMessage?.body ?? "No messages yet"}
            </span>
            {conversation.unreadCount > 0 ? (
              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-bg">
                {conversation.unreadCount}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );

  return (
    <div className="flex h-[calc(100dvh-9rem)] overflow-hidden border-t border-line sm:h-[calc(100dvh-4rem)]">
      <aside
        className={cn(
          "w-full shrink-0 overflow-y-auto border-line md:w-80 md:border-r",
          active !== null ? "hidden md:block" : "block",
        )}
      >
        {tab === "requests" ? (
          <div className="flex items-center gap-2 px-3 py-4">
            <button
              type="button"
              aria-label="Back to messages"
              onClick={() => setTab("inbox")}
              className="cursor-pointer rounded-lg p-1 text-ink-soft hover:text-ink"
            >
              <BackIcon size={20} />
            </button>
            <h1 className="text-lg font-bold text-ink">Requests</h1>
          </div>
        ) : (
          <h1 className="px-4 py-4 text-lg font-bold text-ink">Messages</h1>
        )}

        {tab === "inbox" ? (
          <>
            {requestList.length > 0 ? (
              <button
                type="button"
                onClick={() => setTab("requests")}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface"
              >
                <span className="text-sm font-semibold text-ink">Requests</span>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-bg">
                  {requestList.length}
                </span>
              </button>
            ) : null}
            {list.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">
                No conversations yet. Message someone from their profile.
              </p>
            ) : (
              <ul>{list.map(renderConversationRow)}</ul>
            )}
          </>
        ) : requestList.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">No requests.</p>
        ) : (
          <ul>{requestList.map(renderConversationRow)}</ul>
        )}
      </aside>

      <section
        className={cn("min-w-0 flex-1 flex-col", active !== null ? "flex" : "hidden md:flex")}
      >
        {active === null ? (
          <div className="flex flex-1 items-center justify-center p-8 text-center text-ink-soft">
            Select a conversation to start chatting.
          </div>
        ) : (
          <>
            <header className="flex items-center gap-2 border-b border-line px-4 py-3">
              <button
                type="button"
                aria-label="Back to conversations"
                onClick={() => setActiveId(null)}
                className="cursor-pointer rounded-lg p-1 text-ink-soft hover:text-ink md:hidden"
              >
                <BackIcon size={20} />
              </button>
              {active.isGroup ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <ConversationAvatar summary={active} size={36} />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold leading-tight text-ink">
                        {conversationName(active)}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {active.others.length + 1} members
                      </span>
                    </span>
                  </div>
                  <Menu
                    label="Group options"
                    icon={<MoreIcon />}
                    align="end"
                    items={[
                      {
                        label: "Leave group",
                        icon: <LogoutIcon size={18} />,
                        destructive: true,
                        onSelect: onLeaveGroup,
                      },
                    ]}
                  />
                </>
              ) : (
                <Link
                  href={active.other.username !== null ? `/u/${active.other.username}` : "#"}
                  className="group flex items-center gap-2.5"
                >
                  <span className="relative shrink-0">
                    <Avatar
                      src={active.other.avatarUrl ?? undefined}
                      name={active.other.name}
                      size={36}
                    />
                    {otherOnline ? (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-bg bg-[#22c55e]" />
                    ) : null}
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold leading-tight text-ink group-hover:underline">
                      {active.other.name}
                    </span>
                    {otherOnline ? (
                      <span className="text-xs font-medium text-ink">Online</span>
                    ) : formatLastActive(otherLastSeen) !== null ? (
                      <span className="text-xs text-ink-soft">
                        {formatLastActive(otherLastSeen)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              )}
            </header>

            <div
              className="relative flex-1 overflow-y-auto overflow-x-hidden px-4 py-4"
              style={{ touchAction: "pan-y" }}
              onPointerDown={onAreaPointerDown}
              onPointerMove={onAreaPointerMove}
              onPointerUp={onAreaPointerUp}
              onPointerCancel={onAreaPointerUp}
            >
              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map((index) => (
                    <div
                      key={index}
                      className={cn("flex", index % 2 === 0 ? "justify-start" : "justify-end")}
                    >
                      <span
                        className="h-9 animate-pulse rounded-2xl bg-surface"
                        style={{ width: `${45 + ((index * 13) % 35)}%` }}
                      />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-ink-soft">No messages yet. Say hello 👋</p>
              ) : (
                <div
                  className="space-y-2"
                  style={{
                    transform: `translateX(${dragX}px)`,
                    transition: dragX === 0 ? "transform 200ms ease" : "none",
                  }}
                >
                  {messages.map((message, index) => {
                    const mine = message.senderId === viewerId;
                    const previous = index === 0 ? null : (messages[index - 1]?.createdAt ?? null);
                    const showSender =
                      active.isGroup && !mine && messages[index - 1]?.senderId !== message.senderId;
                    const senderName = active.others.find(
                      (member) => member.id === message.senderId,
                    )?.name;
                    return (
                      <Fragment key={message.id}>
                        {shouldSeparateMessages(previous, message.createdAt) ? (
                          <div className="py-2 text-center text-xs font-medium text-ink-faint">
                            {formatMessageSeparator(message.createdAt)}
                          </div>
                        ) : null}
                        <div
                          className={cn(
                            "relative flex flex-col gap-1",
                            mine ? "items-end" : "items-start",
                          )}
                        >
                          {showSender && senderName !== undefined ? (
                            <span className="px-1 text-[11px] font-semibold text-ink-soft">
                              {senderName}
                            </span>
                          ) : null}
                          {message.pin !== null ? <MessagePin pin={message.pin} /> : null}
                          {message.imageUrl !== null ? (
                            <MessageImage url={message.imageUrl} />
                          ) : null}
                          {message.body !== "" ? (
                            <span
                              title={formatClockTime(message.createdAt)}
                              className={cn(
                                "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px] sm:max-w-[560px]",
                                mine ? "bg-accent text-bg" : "bg-surface text-ink",
                              )}
                            >
                              {message.body}
                            </span>
                          ) : null}
                          <span
                            className="pointer-events-none absolute right-[-48px] top-1/2 -translate-y-1/2 text-xs tabular-nums text-ink-faint transition-opacity"
                            style={{ opacity: dragX < 0 ? 1 : 0 }}
                          >
                            {formatClockTime(message.createdAt)}
                          </span>
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              )}
              {otherTyping ? (
                <p className="mt-2 text-[13px] italic text-ink-soft">
                  {active.other.name} is typing…
                </p>
              ) : null}
              <div ref={endRef} />
            </div>

            {activeIsRequest ? (
              <div className="border-t border-line px-4 py-3">
                <p className="mb-2 text-center text-sm text-ink-soft">
                  <span className="font-semibold text-ink">{active.other.name}</span> wants to send
                  you a message.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 flex-1"
                    onClick={onDeclineRequest}
                  >
                    Decline
                  </Button>
                  <Button type="button" className="h-11 flex-1" onClick={onAcceptRequest}>
                    Accept
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  onSend();
                }}
                className="flex items-center gap-2 border-t border-line px-4 py-3"
              >
                <AttachMenu onPickFile={onAttachImage} onPickGifUrl={sendImageUrl} />
                <Input
                  aria-label="Message"
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    emitTyping(event.target.value !== "");
                  }}
                  onKeyDown={onComposerKeyDown}
                  placeholder="Write a message…"
                />
                <Button type="submit" className="h-11" disabled={draft.trim() === ""}>
                  Send
                </Button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
