"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { EditPinDialog } from "@/components/pin";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { useTimeFormat } from "@/hooks/use-time-format";
import { deletePin, publishPinNow } from "@/server/actions/pins";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link DraftsManager} component.
 */
export type DraftsManagerProps = {
  pins: Pin[];
};

/**
 * A single draft / scheduled pin row with its status and the manage actions.
 *
 * @param props - The pin to manage.
 * @returns The draft card element.
 */
function DraftCard({ pin }: { pin: Pin }): ReactElement {
  const t = useTranslations("profile");
  const tp = useTranslations("pin");
  const time = useTimeFormat();
  const router = useRouter();
  const { show } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const onPublish = (): void => {
    startTransition(async () => {
      const result = await publishPinNow(pin.id);
      if (result.ok) {
        show({ title: t("publishNow") });
        router.refresh();
      } else {
        show({ title: result.error });
      }
    });
  };

  const onDelete = (): void => {
    startTransition(async () => {
      const result = await deletePin(pin.id);
      setConfirmDelete(false);
      if (result.ok) {
        router.refresh();
      } else {
        show({ title: result.error });
      }
    });
  };

  return (
    <li className="flex items-center gap-3 rounded-2xl bg-surface p-3">
      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <Image src={pin.imageUrl} alt="" fill sizes="64px" className="object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{pin.title}</p>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {pin.status === "SCHEDULED" && pin.publishAt !== null ? (
            <>
              <span className="font-medium text-accent">{t("scheduledBadge")}</span>
              {" · "}
              {t("scheduledFor", { when: time.separator(pin.publishAt.toISOString()) })}
            </>
          ) : (
            <span className="font-medium text-ink-soft">{t("draftBadge")}</span>
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} disabled={pending}>
          {tp("editPin")}
        </Button>
        <Button size="sm" onClick={onPublish} loading={pending}>
          {t("publishNow")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-accent"
          onClick={() => setConfirmDelete(true)}
          disabled={pending}
        >
          {tp("deletePin")}
        </Button>
      </div>

      <EditPinDialog
        pinId={pin.id}
        initialTitle={pin.title}
        initialDescription={pin.description ?? ""}
        initialLink={pin.link ?? ""}
        initialTags={pin.tags.map((tag) => tag.name)}
        initialPlace={pin.place}
        initialApproximate={pin.place?.approximate ?? false}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title={tp("deleteTitle")}
        description={tp("deleteBody")}
        confirmLabel={tp("delete")}
        destructive
        pending={pending}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </li>
  );
}

/**
 * The owner-only drafts and scheduled pins view: a list of the user's
 * unpublished pins, each with its status (draft or scheduled time) and controls
 * to publish now, edit or delete it. Shows an empty state when there is nothing.
 *
 * @param props - The owner's draft and scheduled pins.
 * @returns The drafts management list.
 */
export function DraftsManager({ pins }: DraftsManagerProps): ReactElement {
  const t = useTranslations("profile");
  if (pins.length === 0) {
    return <p className="py-16 text-center text-ink-soft">{t("noDrafts")}</p>;
  }
  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-2">
      {pins.map((pin) => (
        <DraftCard key={pin.id} pin={pin} />
      ))}
    </ul>
  );
}
