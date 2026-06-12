"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button, Spinner } from "@/components/ui";
import { SparkleIcon } from "@/icons";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/image";
import { analyzePinImage } from "@/server/actions/ai";
import { createPin } from "@/server/actions/pins";
import type { PinPlace } from "@/types/domain";
import { BoardPicker } from "./BoardPicker";
import type { BoardOption } from "./BoardPicker";
import { PlacePicker } from "./PlacePicker";
import { TagsInput } from "./TagsInput";
import { UploadDropzone } from "./UploadDropzone";
import type { SelectedImage } from "./UploadDropzone";

/**
 * Maximum accepted image size, matching the server action body size limit.
 */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Props for the {@link CreatePin} component.
 */
export type CreatePinProps = {
  boards: BoardOption[];
  aiEnabled: boolean;
};

/**
 * A filled form field with its label sitting inside the control (Pinterest
 * style). The whole field is a label, so clicking anywhere focuses the nested
 * input/textarea/select.
 *
 * @param props - The field label and its control.
 * @returns The field element.
 */
function Field({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <label className="block cursor-text rounded-xl bg-surface px-4 pb-2.5 pt-2 transition-colors focus-within:bg-surface-2">
      <span className="block text-[13px] font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const CONTROL_CLASS =
  "mt-0.5 w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-faint";

/**
 * Builds the form payload for the AI image analysis: the selected image plus any
 * text the user has already typed, for better tag suggestions.
 *
 * @param file - The selected image file.
 * @param title - The current title.
 * @param description - The current description.
 * @returns The analysis form data.
 */
function buildAnalysisForm(file: File, title: string, description: string): FormData {
  const form = new FormData();
  form.set("image", file);
  if (title.trim() !== "") {
    form.set("title", title);
  }
  if (description.trim() !== "") {
    form.set("description", description);
  }
  return form;
}

/**
 * Create Pin form in the Pinterest layout: a tall upload card with a
 * "Save from URL" fallback on the left, and the pin details (title, description,
 * link and board) as inset-label fields on the right, with Publish in the
 * header. Publishing stores the image, persists the pin and redirects.
 *
 * @param props - The user's boards for the selector.
 * @returns The create pin form element.
 */
export function CreatePin({ boards, aiEnabled }: CreatePinProps): ReactElement {
  const t = useTranslations("create");
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [place, setPlace] = useState<PinPlace | null>(null);
  const [placeApproximate, setPlaceApproximate] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [altText, setAltText] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [boardList, setBoardList] = useState(boards);
  const [board, setBoard] = useState(boards[0]?.name ?? "Quick Saves");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onImageChange = (next: SelectedImage | null): void => {
    setImage(next);
    setAltText(null);
  };

  const onSuggest = (): void => {
    if (image === null) {
      return;
    }
    const selected = image;
    setSuggesting(true);
    void (async () => {
      let file = selected.file;
      try {
        file = (await compressImage(selected.file)).file;
      } catch {
        file = selected.file;
      }
      const result = await analyzePinImage(buildAnalysisForm(file, title, description));
      setAltText(result.altText);
      if (result.tags.length > 0) {
        setTags((current) => (current.length === 0 ? result.tags : current));
      }
    })()
      .catch(() => undefined)
      .finally(() => setSuggesting(false));
  };

  const onPublish = (): void => {
    if (image === null) {
      setError(t("addImage"));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const selected = image;
        let upload = { file: selected.file, width: selected.width, height: selected.height };
        try {
          upload = await compressImage(selected.file);
        } catch {
          upload = { file: selected.file, width: selected.width, height: selected.height };
        }
        if (upload.file.size > MAX_IMAGE_BYTES) {
          setError(t("imageTooLargeCompressed"));
          return;
        }
        const formData = new FormData();
        formData.set("title", title);
        formData.set("description", description);
        formData.set("altText", altText ?? "");
        formData.set("link", link);
        formData.set("placeName", place?.name ?? "");
        formData.set("placeAddress", place?.address ?? "");
        formData.set("lat", place !== null ? String(place.lat) : "");
        formData.set("lng", place !== null ? String(place.lng) : "");
        formData.set("placeApproximate", String(place !== null && placeApproximate));
        formData.set("tags", tags.join(","));
        formData.set("board", board);
        formData.set("width", String(upload.width));
        formData.set("height", String(upload.height));
        formData.set("image", upload.file);
        const result = await createPin(formData);
        if (result.error !== null) {
          setError(result.error);
        }
      } catch {
        setError(t("publishFailed"));
      }
    });
  };

  const canPublish = image !== null && title.trim() !== "";

  return (
    <div>
      <header className="-mx-6 mb-8 border-y border-line px-6 py-4">
        <h1 className="text-2xl font-bold text-ink">{t("createPin")}</h1>
      </header>

      <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <UploadDropzone value={image} onChange={onImageChange} />

        <div className="flex flex-col gap-3">
          <Field label={t("title")}>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("titlePlaceholder")}
              className={CONTROL_CLASS}
            />
          </Field>

          <Field label={t("description")}>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className={`${CONTROL_CLASS} resize-none`}
            />
          </Field>

          <Field label={t("link")}>
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder={t("linkPlaceholder")}
              className={CONTROL_CLASS}
            />
          </Field>

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

          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <TagsInput value={tags} onChange={setTags} />
            </div>
            {aiEnabled ? (
              <button
                type="button"
                onClick={onSuggest}
                disabled={image === null || suggesting}
                aria-label={t("suggestWithAi")}
                title={t("suggestWithAi")}
                className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-xl bg-surface transition-colors",
                  image === null || suggesting
                    ? "cursor-not-allowed text-ink-faint"
                    : "text-accent hover:bg-surface-2",
                )}
              >
                {suggesting ? <Spinner size={18} /> : <SparkleIcon size={18} />}
              </button>
            ) : null}
          </div>

          <BoardPicker
            boards={boardList}
            value={board}
            onChange={setBoard}
            onCreated={(created) => setBoardList((prev) => [...prev, created])}
          />

          {error !== null ? (
            <p role="alert" className="text-sm font-medium text-accent">
              {error}
            </p>
          ) : null}

          <Button
            fullWidth
            className="mt-1"
            loading={pending}
            disabled={!canPublish}
            onClick={onPublish}
          >
            {t("publish")}
          </Button>
        </div>
      </div>
    </div>
  );
}
