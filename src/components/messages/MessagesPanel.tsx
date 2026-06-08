"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent, PointerEvent, ReactElement } from "react";
import { useNavPanel } from "@/components/layout/NavPanelProvider";
import { Avatar, Button, Input } from "@/components/ui";
import { BackIcon, CloseIcon, ComposeIcon, SearchIcon, SendIcon, TrashIcon } from "@/icons";
import { cn } from "@/lib/cn";
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
  deleteConversation,
  fetchMessages,
  loadInbox,
  markConversationRead,
  searchRecipients,
  sendMessage,
  startConversation,
} from "@/server/actions/messages";
import type { ChatMessage, ConversationSummary, Creator } from "@/types/domain";
import { useMessagesUnread } from "./MessagesProvider";

/**
 * Props for the {@link MessagesPanel} component.
 */
export type MessagesPanelProps = {
  viewerId: string;
  viewerName: string;
  viewerImage: string | null;
};

type Recipient = { id: string; name: string; username: string; avatarUrl: string | null };
type PanelView = "list" | "requests" | "compose" | "conversation";
type SendResult = { ok: true; message: ChatMessage } | { ok: false };

const TYPING_THROTTLE_MS = 1500;
const TYPING_CLEAR_MS = 3000;

/**
 * Builds a current ISO timestamp for optimistic UI. Isolated so the impurity is
 * confined to event handlers rather than the render path.
 *
 * @returns The current time as an ISO string.
 */
function nowIso(): string {
  return new Date().toISOString();
}

const ROW_REVEAL_WIDTH = 72;

/**
 * A single inbox conversation row. When an `onDelete` handler is provided the
 * row can be swiped (or dragged) to the left to reveal a delete button behind
 * it; a short drag is treated as a tap that opens the conversation. Without
 * `onDelete` (e.g. message requests) it is a plain, non-swipeable row.
 *
 * @param props - The conversation summary and the open/delete handlers.
 * @returns The row element.
 */
function ConversationRow({
  conversation,
  onOpen,
  onDelete,
}: {
  conversation: ConversationSummary;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
}): ReactElement {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<{ x: number; y: number; base: number; active: boolean } | null>(null);
  const movedRef = useRef(false);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
    if (onDelete === undefined) {
      return;
    }
    startRef.current = { x: event.clientX, y: event.clientY, base: offset, active: false };
    movedRef.current = false;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
    const start = startRef.current;
    if (start === null) {
      return;
    }
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.active) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        start.active = true;
        movedRef.current = true;
        setDragging(true);
      } else if (Math.abs(dy) > 8) {
        startRef.current = null;
        return;
      } else {
        return;
      }
    }
    setOffset(Math.max(-ROW_REVEAL_WIDTH, Math.min(0, start.base + dx)));
  };

  const onPointerUp = (): void => {
    const start = startRef.current;
    startRef.current = null;
    setDragging(false);
    if (start === null) {
      return;
    }
    setOffset((current) => (current < -ROW_REVEAL_WIDTH / 2 ? -ROW_REVEAL_WIDTH : 0));
  };

  const onClick = (): void => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (offset !== 0) {
      setOffset(0);
      return;
    }
    onOpen(conversation.id);
  };

  return (
    <li className="relative overflow-hidden">
      {onDelete !== undefined ? (
        <button
          type="button"
          aria-label={`Delete conversation with ${conversation.other.name}`}
          onClick={() => onDelete(conversation.id)}
          className="absolute inset-y-0 right-0 grid w-[72px] cursor-pointer place-items-center bg-[#e60023] text-bg"
        >
          <TrashIcon size={20} />
        </button>
      ) : null}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? "none" : "transform 200ms ease",
          touchAction: "pan-y",
        }}
        className="relative bg-bg"
      >
        <button
          type="button"
          onClick={onClick}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
        >
          <Avatar
            src={conversation.other.avatarUrl ?? undefined}
            name={conversation.other.name}
            size={48}
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[15px] font-semibold text-ink">
                {conversation.other.name}
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
                <span className="size-2.5 shrink-0 rounded-full bg-accent" />
              ) : null}
            </span>
          </span>
        </button>
      </div>
    </li>
  );
}

/**
 * Pinterest-style messages overlay: a narrow panel that slides in to the right
 * of the {@link SideNav} rail (desktop only) over the current page, leaving the
 * feed visible behind it. It opens with a conversation list, "new message"
 * recipient search and suggestions, and drills into a single conversation with
 * live delivery, typing and presence — mirroring the realtime wiring of the
 * full-page {@link Messenger}. On mobile the dedicated `/messages` route is used
 * instead, so this panel is hidden below the `sm` breakpoint.
 *
 * @param props - The viewer's id, display name and avatar.
 * @returns The overlay element.
 */
export function MessagesPanel({
  viewerId,
  viewerName,
  viewerImage,
}: MessagesPanelProps): ReactElement {
  const { markRead: clearUnreadBadge } = useMessagesUnread();
  const { activePanel, close: closePanel } = useNavPanel();
  const panelOpen = activePanel === "messages";

  const [inboxLoaded, setInboxLoaded] = useState(false);
  const [list, setList] = useState<ConversationSummary[]>([]);
  const [requestList, setRequestList] = useState<ConversationSummary[]>([]);
  const [suggestions, setSuggestions] = useState<Creator[]>([]);
  const [view, setView] = useState<PanelView>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [presence, setPresence] = useState<{
    userId: string;
    online: boolean;
    lastSeenAt: string | null;
  } | null>(null);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [pendingConversation, setPendingConversation] = useState<{
    id: string;
    other: Creator;
  } | null>(null);
  const [, startTransition] = useTransition();

  const endRef = useRef<HTMLDivElement>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const pendingSummary: ConversationSummary | null =
    pendingConversation !== null && pendingConversation.id === activeId
      ? {
          id: pendingConversation.id,
          other: pendingConversation.other,
          lastMessage: null,
          unreadCount: 0,
          updatedAt: "",
        }
      : null;
  const active =
    list.find((conversation) => conversation.id === activeId) ??
    requestList.find((conversation) => conversation.id === activeId) ??
    pendingSummary;
  const activeIsRequest = activeId !== null && requestList.some((r) => r.id === activeId);
  const otherId = active?.other.id ?? null;
  const presenceForOther = presence !== null && presence.userId === otherId ? presence : null;
  const otherOnline = presenceForOther?.online === true;
  const otherLastSeen =
    presenceForOther !== null && !presenceForOther.online ? presenceForOther.lastSeenAt : null;

  useEffect(() => {
    if (!panelOpen || inboxLoaded) {
      return;
    }
    let cancelled = false;
    void loadInbox().then((result) => {
      if (cancelled) {
        return;
      }
      if (result.ok) {
        setList(result.conversations);
        setRequestList(result.requests);
        setSuggestions(result.suggestions);
      }
      setInboxLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [panelOpen, inboxLoaded]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }
    const onKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.key === "Escape") {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panelOpen, closePanel]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, otherTyping]);

  useEffect(() => {
    if (view !== "compose") {
      return;
    }
    const handle = setTimeout(() => {
      void searchRecipients(recipientQuery).then((result) => {
        if (result.ok) {
          setRecipients(result.users);
        }
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [recipientQuery, view]);

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
    setLoadingThread(true);
    setView("conversation");
    clearUnreadBadge(id);
    setList((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    );
    startTransition(async () => {
      const result = await fetchMessages(id);
      setLoadingThread(false);
      if (result.ok) {
        setMessages(result.messages);
      }
    });
    void markConversationRead(id);
  };

  const startWith = (other: Creator): void => {
    startTransition(async () => {
      const result = await startConversation(other.id);
      if (!result.ok) {
        return;
      }
      const conversationId = result.conversationId;
      const existing = list.find((conversation) => conversation.id === conversationId);
      setActiveId(conversationId);
      setPendingConversation(existing === undefined ? { id: conversationId, other } : null);
      setMessages([]);
      setOtherTyping(false);
      setLoadingThread(true);
      setView("conversation");
      const messagesResult = await fetchMessages(conversationId);
      setLoadingThread(false);
      if (messagesResult.ok) {
        setMessages(messagesResult.messages);
      }
      void markConversationRead(conversationId);
    });
  };

  const onPickRecipient = (recipient: Recipient): void => {
    startWith({
      id: recipient.id,
      name: recipient.name,
      username: recipient.username,
      avatarUrl: recipient.avatarUrl,
      bio: null,
      followersLabel: null,
      verified: false,
    });
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
        setView("requests");
      }
    });
  };

  const onDeleteConversation = (id: string): void => {
    setList((current) => current.filter((conversation) => conversation.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setPendingConversation(null);
      setView("list");
    }
    startTransition(async () => {
      await deleteConversation(id);
    });
  };

  const deliver = (conversationId: string, body: string): Promise<SendResult> => {
    const socket = getRealtimeSocket();
    if (socket.connected) {
      return new Promise<SendResult>((resolve) => {
        socket
          .timeout(5000)
          .emit("message:send", { conversationId, body }, (error: unknown, response: unknown) => {
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
          });
      });
    }
    return sendMessage(conversationId, body).then((result) =>
      result.ok ? { ok: true, message: result.message } : { ok: false },
    );
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

  const onSend = (): void => {
    const text = draft.trim();
    if (text === "" || activeId === null) {
      return;
    }
    const conversationId = activeId;
    setDraft("");
    emitTyping(false);
    const createdAt = nowIso();
    const tempId = `temp-${createdAt}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: viewerId,
      body: text,
      createdAt,
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
        const lastMessage = { body: saved.body, createdAt: saved.createdAt, senderId: viewerId };
        setList((current) => {
          const known = current.some((conversation) => conversation.id === conversationId);
          const next =
            known || pendingConversation === null || pendingConversation.id !== conversationId
              ? current
              : [
                  {
                    id: conversationId,
                    other: pendingConversation.other,
                    lastMessage: null,
                    unreadCount: 0,
                    updatedAt: saved.createdAt,
                  },
                  ...current,
                ];
          return next
            .map((conversation) =>
              conversation.id === conversationId
                ? { ...conversation, lastMessage, updatedAt: saved.createdAt }
                : conversation,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
        setPendingConversation((current) =>
          current !== null && current.id === conversationId ? null : current,
        );
      } else {
        setMessages((current) => current.filter((message) => message.id !== tempId));
      }
    });
  };

  const onComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSend();
    }
  };

  const openCompose = (): void => {
    setView("compose");
    setRecipientQuery("");
  };

  return (
    <aside
      aria-label="Messages"
      aria-hidden={!panelOpen}
      inert={!panelOpen}
      className={cn(
        "fixed bottom-0 left-16 top-0 z-40 hidden w-[360px] flex-col border-r border-line bg-bg transition-transform duration-200 ease-out sm:flex",
        panelOpen ? "translate-x-0" : "pointer-events-none -translate-x-[calc(100%+0.5rem)]",
      )}
    >
      {view === "conversation" && active !== null ? (
        <>
          <header className="flex items-center gap-1 px-2 py-2.5">
            <button
              type="button"
              aria-label="Back to messages"
              onClick={() => setView("list")}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <BackIcon size={20} />
            </button>
            <Link
              href={active.other.username !== null ? `/u/${active.other.username}` : "#"}
              className="group flex min-w-0 flex-1 items-center gap-2.5"
            >
              <span className="relative shrink-0">
                <Avatar
                  src={active.other.avatarUrl ?? undefined}
                  name={active.other.name}
                  size={32}
                />
                {otherOnline ? (
                  <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-bg bg-[#22c55e]" />
                ) : null}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold leading-tight text-ink group-hover:underline">
                  {active.other.name}
                </span>
                {otherOnline ? (
                  <span className="text-xs font-medium text-ink">Online</span>
                ) : formatLastActive(otherLastSeen) !== null ? (
                  <span className="truncate text-xs text-ink-soft">
                    {formatLastActive(otherLastSeen)}
                  </span>
                ) : null}
              </span>
            </Link>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {loadingThread ? (
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
              <div className="flex flex-col items-center justify-center px-6 pt-10 text-center">
                <div className="flex items-center">
                  <Avatar
                    src={active.other.avatarUrl ?? undefined}
                    name={active.other.name}
                    size={56}
                  />
                  <span className="-ml-4 rounded-full ring-2 ring-bg">
                    <Avatar src={viewerImage ?? undefined} name={viewerName} size={56} />
                  </span>
                </div>
                <p className="mt-3 font-semibold text-ink">{active.other.name}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  This could be the start of something great.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((message, index) => {
                  const mine = message.senderId === viewerId;
                  const previous = index === 0 ? null : (messages[index - 1]?.createdAt ?? null);
                  return (
                    <Fragment key={message.id}>
                      {shouldSeparateMessages(previous, message.createdAt) ? (
                        <div className="py-2 text-center text-xs font-medium text-ink-faint">
                          {formatMessageSeparator(message.createdAt)}
                        </div>
                      ) : null}
                      <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                        <span
                          title={formatClockTime(message.createdAt)}
                          className={cn(
                            "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px]",
                            mine ? "bg-accent text-bg" : "bg-surface text-ink",
                          )}
                        >
                          {message.body}
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
            <div className="px-4 py-3">
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
              className="px-3 py-3"
            >
              <Input
                aria-label="Message"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  emitTyping(event.target.value !== "");
                }}
                onKeyDown={onComposerKeyDown}
                placeholder="Type a message…"
                endAdornment={
                  <button
                    type="submit"
                    aria-label="Send message"
                    disabled={draft.trim() === ""}
                    className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-xl bg-accent text-bg transition-opacity hover:bg-accent-press disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <SendIcon size={18} />
                  </button>
                }
              />
            </form>
          )}
        </>
      ) : view === "compose" ? (
        <>
          <header className="flex items-center gap-1 px-2 py-2.5">
            <button
              type="button"
              aria-label="Back to messages"
              onClick={() => setView("list")}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <BackIcon size={20} />
            </button>
            <h2 className="flex-1 text-lg font-bold text-ink">New message</h2>
            <button
              type="button"
              aria-label="Close messages"
              onClick={closePanel}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <CloseIcon size={20} />
            </button>
          </header>
          <div className="px-4 pb-2">
            <Input
              aria-label="Search people"
              autoFocus
              value={recipientQuery}
              onChange={(event) => setRecipientQuery(event.target.value)}
              placeholder="Search by name or username"
              leadingIcon={<SearchIcon size={18} />}
            />
          </div>
          <div className="flex-1 overflow-y-auto pb-2">
            {recipients.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">No people found.</p>
            ) : (
              <ul>
                {recipients.map((recipient) => (
                  <li key={recipient.id}>
                    <button
                      type="button"
                      onClick={() => onPickRecipient(recipient)}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
                    >
                      <Avatar
                        src={recipient.avatarUrl ?? undefined}
                        name={recipient.name}
                        size={44}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink">
                          {recipient.name}
                        </span>
                        <span className="block truncate text-[13px] text-ink-soft">
                          @{recipient.username}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : view === "requests" ? (
        <>
          <header className="flex items-center gap-1 px-2 py-2.5">
            <button
              type="button"
              aria-label="Back to messages"
              onClick={() => setView("list")}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <BackIcon size={20} />
            </button>
            <h2 className="flex-1 text-lg font-bold text-ink">Requests</h2>
            <button
              type="button"
              aria-label="Close messages"
              onClick={closePanel}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <CloseIcon size={20} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto pb-2">
            {requestList.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft">No requests.</p>
            ) : (
              <ul>
                {requestList.map((conversation) => (
                  <ConversationRow
                    key={conversation.id}
                    conversation={conversation}
                    onOpen={openConversation}
                  />
                ))}
              </ul>
            )}
          </div>
        </>
      ) : (
        <>
          <header className="flex items-center justify-between px-4 pb-1 pt-3">
            <h2 className="text-xl font-bold text-ink">Messages</h2>
            <button
              type="button"
              aria-label="Close messages"
              onClick={closePanel}
              className="-mr-1 grid size-9 cursor-pointer place-items-center rounded-xl text-ink-soft hover:bg-surface hover:text-ink"
            >
              <CloseIcon size={20} />
            </button>
          </header>
          <div className="px-2 py-1">
            <button
              type="button"
              onClick={openCompose}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-surface"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-bg">
                <ComposeIcon size={22} />
              </span>
              <span className="text-[16px] font-bold text-ink">New message</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-2">
            {!inboxLoaded ? (
              <ul>
                {[0, 1, 2, 3].map((index) => (
                  <li key={index} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="size-12 shrink-0 animate-pulse rounded-full bg-surface" />
                    <span className="flex-1 space-y-2">
                      <span className="block h-3.5 w-2/5 animate-pulse rounded bg-surface" />
                      <span className="block h-3 w-3/5 animate-pulse rounded bg-surface" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <>
                {requestList.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setView("requests")}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface"
                  >
                    <span className="text-[15px] font-semibold text-ink">Requests</span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-bg">
                      {requestList.length}
                    </span>
                  </button>
                ) : null}

                {list.length > 0 ? (
                  <>
                    <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Messages
                    </p>
                    <ul>
                      {list.map((conversation) => (
                        <ConversationRow
                          key={conversation.id}
                          conversation={conversation}
                          onOpen={openConversation}
                          onDelete={onDeleteConversation}
                        />
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="px-4 py-6 text-center text-sm text-ink-soft">
                    No conversations yet. Start one below.
                  </p>
                )}

                {suggestions.length > 0 ? (
                  <>
                    <p className="px-4 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                      Suggestions
                    </p>
                    <ul>
                      {suggestions.map((person) => (
                        <li key={person.id}>
                          <button
                            type="button"
                            onClick={() => startWith(person)}
                            className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface"
                          >
                            <Avatar
                              src={person.avatarUrl ?? undefined}
                              name={person.name}
                              size={48}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[15px] font-semibold text-ink">
                                {person.name}
                              </span>
                              {person.username !== null ? (
                                <span className="block truncate text-[13px] text-ink-soft">
                                  @{person.username}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
