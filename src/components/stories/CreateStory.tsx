"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { UploadDropzone } from "@/components/create";
import type { SelectedImage } from "@/components/create";
import { Button } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { createStory } from "@/server/actions/stories";

/** Maximum accepted poster size, matching the server action body size limit. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Create-a-story form: a minimal media picker (photo or video, with the same
 * trim editor and auto poster as pins) and a single "Share to story" action.
 * Publishing stores the media, posts a 24h story and redirects home.
 *
 * @returns The create story form element.
 */
export function CreateStory(): ReactElement {
  const t = useTranslations("stories");
  const tc = useTranslations("create");
  const [media, setMedia] = useState<SelectedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (): void => {
    if (media === null) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const selected = media;
        let upload = { file: selected.file, width: selected.width, height: selected.height };
        try {
          upload = await compressImage(selected.file);
        } catch {
          upload = { file: selected.file, width: selected.width, height: selected.height };
        }
        if (upload.file.size > MAX_IMAGE_BYTES) {
          setError(tc("imageTooLargeCompressed"));
          return;
        }
        const formData = new FormData();
        formData.set("width", String(upload.width));
        formData.set("height", String(upload.height));
        formData.set("image", upload.file);
        if (selected.mediaType === "VIDEO" && selected.videoFile !== undefined) {
          formData.set("mediaType", "VIDEO");
          formData.set("video", selected.videoFile);
          formData.set("videoDurationS", String(selected.durationS ?? ""));
        }
        const result = await createStory(formData);
        if (result.error !== null) {
          setError(result.error);
        }
      } catch {
        setError(t("shareFailed"));
      }
    });
  };

  return (
    <div className="mx-auto max-w-md">
      <header className="-mx-6 mb-6 border-y border-line px-6 py-4">
        <h1 className="text-2xl font-bold text-ink">{t("createTitle")}</h1>
      </header>
      <p className="mb-4 text-sm text-ink-soft">{t("pickHint")}</p>
      <UploadDropzone value={media} onChange={setMedia} minimal />
      {error !== null ? (
        <p role="alert" className="mt-3 text-sm text-accent">
          {error}
        </p>
      ) : null}
      <Button
        fullWidth
        className="mt-4"
        disabled={media === null}
        loading={pending}
        onClick={submit}
      >
        {t("shareToStory")}
      </Button>
    </div>
  );
}
