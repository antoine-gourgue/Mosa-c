"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ReactElement } from "react";
import { useNavPanel } from "@/components/layout/NavPanelProvider";
import { Button, useToast } from "@/components/ui";
import { startConversation } from "@/server/actions/messages";

/**
 * Props for the {@link MessageButton} component.
 */
export type MessageButtonProps = {
  userId: string;
};

/**
 * Opens (or starts) a direct conversation with another user. On desktop it opens
 * the messages panel with that conversation; on mobile it navigates to the
 * `/messages` page. Only rendered between mutual followers; the server still
 * enforces the rule.
 *
 * @param props - The other user's id.
 * @returns The message button element.
 */
export function MessageButton({ userId }: MessageButtonProps): ReactElement {
  const t = useTranslations("profile");
  const router = useRouter();
  const { open } = useNavPanel();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const onClick = (): void => {
    startTransition(async () => {
      const result = await startConversation(userId);
      if (!result.ok) {
        show({ title: t("cantMessage"), description: result.error });
        return;
      }
      if (window.matchMedia("(min-width: 640px)").matches) {
        open("messages", result.conversationId);
      } else {
        router.push(`/messages?c=${result.conversationId}`);
      }
    });
  };

  return (
    <Button variant="ghost" onClick={onClick} disabled={pending}>
      {t("message")}
    </Button>
  );
}
