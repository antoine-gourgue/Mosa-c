"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReactElement } from "react";
import { Button, useToast } from "@/components/ui";
import { startConversation } from "@/server/actions/messages";

/**
 * Props for the {@link MessageButton} component.
 */
export type MessageButtonProps = {
  userId: string;
};

/**
 * Opens (or starts) a direct conversation with another user and navigates to
 * the inbox with that conversation selected. Only rendered between mutual
 * followers; the server still enforces the rule.
 *
 * @param props - The other user's id.
 * @returns The message button element.
 */
export function MessageButton({ userId }: MessageButtonProps): ReactElement {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const onClick = (): void => {
    startTransition(async () => {
      const result = await startConversation(userId);
      if (result.ok) {
        router.push(`/messages?c=${result.conversationId}`);
      } else {
        show({ title: "Can't message", description: result.error });
      }
    });
  };

  return (
    <Button variant="ghost" onClick={onClick} disabled={pending}>
      Message
    </Button>
  );
}
