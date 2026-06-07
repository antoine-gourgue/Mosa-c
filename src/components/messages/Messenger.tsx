"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { BackIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { getRealtimeSocket } from "@/lib/realtime";
import { formatRelativeTime } from "@/lib/time";
import { fetchMessages, markConversationRead, sendMessage } from "@/server/actions/messages";
import type { ChatMessage, ConversationSummary } from "@/types/domain";

/**
 * Props for the {@link Messenger} component.
 */
export type MessengerProps = {
  conversations: ConversationSummary[];
  viewerId: string;
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
export function Messenger({ conversations, viewerId }: MessengerProps): ReactElement {
  const [list, setList] = useState(conversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [otherTyping, setOtherTyping] = useState(false);
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const typingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const active = list.find((conversation) => conversation.id === activeId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, otherTyping]);

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
  }, [activeId, viewerId]);

  const openConversation = (id: string): void => {
    setActiveId(id);
    setMessages([]);
    setOtherTyping(false);
    setLoading(true);
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

  return (
    <div className="flex h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-line">
      <aside
        className={cn(
          "w-full shrink-0 overflow-y-auto border-line md:w-80 md:border-r",
          active !== null ? "hidden md:block" : "block",
        )}
      >
        <h1 className="px-4 py-4 text-lg font-bold text-ink">Messages</h1>
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-soft">
            No conversations yet. Message someone you both follow from their profile.
          </p>
        ) : (
          <ul>
            {list.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => openConversation(conversation.id)}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface",
                    conversation.id === activeId ? "bg-surface" : "",
                  )}
                >
                  <Avatar
                    src={conversation.other.avatarUrl ?? undefined}
                    name={conversation.other.name}
                    size={44}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">
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
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-bg">
                          {conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
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
                className="cursor-pointer rounded-full p-1 text-ink-soft hover:text-ink md:hidden"
              >
                <BackIcon size={20} />
              </button>
              <Link
                href={active.other.username !== null ? `/u/${active.other.username}` : "#"}
                className="flex items-center gap-2.5 hover:underline"
              >
                <Avatar
                  src={active.other.avatarUrl ?? undefined}
                  name={active.other.name}
                  size={36}
                />
                <span className="font-semibold text-ink">{active.other.name}</span>
              </Link>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {loading ? (
                <p className="text-center text-sm text-ink-soft">Loading…</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-ink-soft">No messages yet. Say hello 👋</p>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === viewerId;
                  return (
                    <div
                      key={message.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <span
                        className={cn(
                          "max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[15px]",
                          mine ? "bg-accent text-bg" : "bg-surface text-ink",
                        )}
                      >
                        {message.body}
                      </span>
                    </div>
                  );
                })
              )}
              {otherTyping ? (
                <p className="text-[13px] italic text-ink-soft">{active.other.name} is typing…</p>
              ) : null}
              <div ref={endRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSend();
              }}
              className="flex items-center gap-2 border-t border-line px-4 py-3"
            >
              <input
                aria-label="Message"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);
                  emitTyping(event.target.value !== "");
                }}
                onKeyDown={onComposerKeyDown}
                placeholder="Write a message…"
                className="h-11 flex-1 rounded-full bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:bg-surface-2"
              />
              <Button type="submit" className="h-11" disabled={draft.trim() === ""}>
                Send
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
