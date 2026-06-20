"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, ConfirmDialog, useToast } from "@/components/ui";
import { deletePin, restorePin } from "@/server/actions/pins";
import type { Pin } from "@/types/domain";

/**
 * Props for the {@link ArchiveManager} component.
 */
export type ArchiveManagerProps = {
  pins: Pin[];
};

/**
 * A single archived pin row with controls to restore it to published or delete
 * it for good.
 *
 * @param props - The archived pin to manage.
 * @param props.pin - The archived pin.
 * @returns The archived pin card element.
 */
function ArchiveCard({ pin }: { pin: Pin }): ReactElement {
  const t = useTranslations("profile");
  const tp = useTranslations("pin");
  const router = useRouter();
  const { show } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const onRestore = (): void => {
    startTransition(async () => {
      const result = await restorePin(pin.id);
      if (result.ok) {
        show({ title: tp("pinRestored") });
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
        <p className="mt-0.5 text-[13px] font-medium text-ink-soft">{t("archivedBadge")}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="sm" onClick={onRestore} loading={pending}>
          {tp("restorePin")}
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
 * The owner-only archive view: a list of the user's archived pins, each with
 * controls to restore it to published or delete it. Shows an empty state when
 * there is nothing archived.
 *
 * @param props - The owner's archived pins.
 * @returns The archive management list.
 */
export function ArchiveManager({ pins }: ArchiveManagerProps): ReactElement {
  const t = useTranslations("profile");
  if (pins.length === 0) {
    return <p className="py-16 text-center text-ink-soft">{t("noArchived")}</p>;
  }
  return (
    <ul className="mx-auto flex max-w-2xl flex-col gap-2">
      {pins.map((pin) => (
        <ArchiveCard key={pin.id} pin={pin} />
      ))}
    </ul>
  );
}
