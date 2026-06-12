"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import type { ReactElement } from "react";
import { PlacePicker } from "@/components/create/PlacePicker";
import { TagsInput } from "@/components/create/TagsInput";
import { Button, Input, Textarea } from "@/components/ui";
import { updatePin } from "@/server/actions/pins";
import type { PinPlace } from "@/types/domain";

/**
 * Props for the {@link EditPinDialog} component.
 */
export type EditPinDialogProps = {
  pinId: string;
  initialTitle: string;
  initialDescription: string;
  initialLink: string;
  initialTags: string[];
  initialPlace: PinPlace | null;
  initialApproximate: boolean;
  open: boolean;
  onClose: () => void;
};

/**
 * Modal for the pin creator to edit a pin's title, description, link and tags
 * (the image is not editable). Rendered in a portal with a dimmed backdrop,
 * closing on Escape or backdrop click. Refreshes the route on success.
 *
 * @param props - The pin's current values, open state and close handler.
 * @returns The dialog element, or null when closed.
 */
export function EditPinDialog({
  pinId,
  initialTitle,
  initialDescription,
  initialLink,
  initialTags,
  initialPlace,
  initialApproximate,
  open,
  onClose,
}: EditPinDialogProps): ReactElement | null {
  const t = useTranslations("create");
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [link, setLink] = useState(initialLink);
  const [tags, setTags] = useState(initialTags);
  const [place, setPlace] = useState<PinPlace | null>(initialPlace);
  const [placeApproximate, setPlaceApproximate] = useState(initialApproximate);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const onSave = (): void => {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("link", link);
      formData.set("placeName", place?.name ?? "");
      formData.set("placeAddress", place?.address ?? "");
      formData.set("lat", place !== null ? String(place.lat) : "");
      formData.set("lng", place !== null ? String(place.lng) : "");
      formData.set("placeApproximate", String(place !== null && placeApproximate));
      formData.set("tags", tags.join(","));
      const result = await updatePin(pinId, formData);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-bg p-6 shadow-pop"
      >
        <h2 className="mb-4 text-xl font-extrabold text-ink">{t("editPin")}</h2>
        <div className="flex flex-col gap-3">
          <Input
            label={t("title")}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("titlePlaceholder")}
            maxLength={120}
            autoFocus
          />
          <Textarea
            label={t("description")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
            maxLength={2000}
          />
          <Input
            label={t("link")}
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder={t("linkPlaceholder")}
          />
          <TagsInput value={tags} onChange={setTags} />
          <PlacePicker
            value={place}
            onChange={(next) => {
              setPlace(next);
              if (next === null) {
                setPlaceApproximate(false);
              }
            }}
            approximate={placeApproximate}
            onApproximateChange={setPlaceApproximate}
          />
        </div>

        {error !== null ? (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={onSave} disabled={pending || title.trim() === ""}>
            {t("save")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
