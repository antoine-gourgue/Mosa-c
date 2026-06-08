"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Avatar, IconButton, Input, useToast } from "@/components/ui";
import { useMessagesUnread } from "@/components/messages/MessagesProvider";
import { SearchIcon, ShareIcon } from "@/icons";
import { getRealtimeSocket } from "@/lib/realtime";
import { sendMessage, searchRecipients, startConversation } from "@/server/actions/messages";

type Recipient = { id: string; name: string; username: string; avatarUrl: string | null };

/**
 * Props for the {@link SharePinMenu} component.
 */
export type SharePinMenuProps = {
  pinId: string;
};

/**
 * Pin action that shares the pin into a direct message: an icon button opening a
 * dropdown to search people, then sending the pin to the chosen recipient. The
 * conversation is created (or reused) first; delivery goes over the realtime
 * socket when connected and falls back to the server action otherwise. Closes on
 * outside click or Escape.
 *
 * @param props - The pin to share.
 * @returns The share control element.
 */
export function SharePinMenu({ pinId }: SharePinMenuProps): ReactElement {
  const { show } = useToast();
  const { refreshInbox } = useMessagesUnread();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Recipient[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent): void => {
      if (rootRef.current !== null && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    void searchRecipients(query).then((result) => {
      if (requestRef.current !== requestId) {
        return;
      }
      setResults(result.ok ? result.users : []);
    });
  }, [query, open]);

  const share = (recipient: Recipient): void => {
    setSendingId(recipient.id);
    startTransition(async () => {
      const conversation = await startConversation(recipient.id);
      if (!conversation.ok) {
        show({ title: "Couldn't send", description: conversation.error });
        setSendingId(null);
        return;
      }
      const socket = getRealtimeSocket();
      if (socket.connected) {
        socket.emit("message:send", { conversationId: conversation.conversationId, pinId });
      } else {
        const result = await sendMessage(conversation.conversationId, "", pinId);
        if (!result.ok) {
          show({ title: "Couldn't send", description: result.error });
          setSendingId(null);
          return;
        }
      }
      refreshInbox();
      show({ title: `Sent to ${recipient.name}` });
      setSendingId(null);
      setOpen(false);
    });
  };

  return (
    <div ref={rootRef} className="relative">
      <IconButton label="Share in a message" onClick={() => setOpen((value) => !value)}>
        <ShareIcon />
      </IconButton>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-line bg-bg p-2 shadow-pop">
          <Input
            aria-label="Search people"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people"
            leadingIcon={<SearchIcon size={18} />}
          />
          <ul className="mt-2 max-h-64 overflow-auto">
            {results.length === 0 ? (
              <li className="px-2 py-3 text-sm text-ink-soft">No people found.</li>
            ) : (
              results.map((recipient) => (
                <li key={recipient.id}>
                  <button
                    type="button"
                    disabled={sendingId !== null}
                    onClick={() => share(recipient)}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface disabled:opacity-50"
                  >
                    <Avatar
                      src={recipient.avatarUrl ?? undefined}
                      name={recipient.name}
                      size={36}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">
                        {recipient.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        @{recipient.username}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
