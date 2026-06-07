"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import type { KeyboardEvent, ReactElement } from "react";
import { Avatar, Button } from "@/components/ui";
import { BackIcon } from "@/icons";
import { cn } from "@/lib/cn";
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

/**
 * Direct-messages inbox: a conversation list on the left and the selected
 * conversation with a composer on the right. On mobile, the list and the open
 * conversation are shown one at a time. Sending is optimistic and persists
 * through the message action; live delivery is wired in a later ticket.
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
  const [, startTransition] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  const active = list.find((conversation) => conversation.id === activeId) ?? null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const openConversation = (id: string): void => {
    setActiveId(id);
    setMessages([]);
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

  const onSend = (): void => {
    const text = draft.trim();
    if (text === "" || activeId === null) {
      return;
    }
    setDraft("");
    startTransition(async () => {
      const result = await sendMessage(activeId, text);
      if (result.ok) {
        setMessages((current) => [...current, result.message]);
        setList((current) =>
          [...current]
            .map((conversation) =>
              conversation.id === activeId
                ? {
                    ...conversation,
                    lastMessage: {
                      body: result.message.body,
                      createdAt: result.message.createdAt,
                      senderId: viewerId,
                    },
                    updatedAt: result.message.createdAt,
                  }
                : conversation,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      }
    });
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
                onChange={(event) => setDraft(event.target.value)}
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
