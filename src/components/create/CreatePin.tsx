"use client";

import { useState, useTransition } from "react";
import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { createPin } from "@/server/actions/pins";
import { BoardPicker } from "./BoardPicker";
import type { BoardOption } from "./BoardPicker";
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
 * Create Pin form in the Pinterest layout: a tall upload card with a
 * "Save from URL" fallback on the left, and the pin details (title, description,
 * link and board) as inset-label fields on the right, with Publish in the
 * header. Publishing stores the image, persists the pin and redirects.
 *
 * @param props - The user's boards for the selector.
 * @returns The create pin form element.
 */
export function CreatePin({ boards }: CreatePinProps): ReactElement {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [boardList, setBoardList] = useState(boards);
  const [board, setBoard] = useState(boards[0]?.name ?? "Quick Saves");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onPublish = (): void => {
    if (image === null) {
      setError("Please add an image.");
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
          setError("Image must be under 10 MB, even after compression.");
          return;
        }
        const formData = new FormData();
        formData.set("title", title);
        formData.set("description", description);
        formData.set("link", link);
        formData.set("board", board);
        formData.set("width", String(upload.width));
        formData.set("height", String(upload.height));
        formData.set("image", upload.file);
        const result = await createPin(formData);
        if (result.error !== null) {
          setError(result.error);
        }
      } catch {
        setError("Could not publish this image. Please try another photo.");
      }
    });
  };

  const canPublish = image !== null && title.trim() !== "";

  return (
    <div>
      <header className="-mx-6 mb-8 border-y border-line px-6 py-4">
        <h1 className="text-2xl font-bold text-ink">Create Pin</h1>
      </header>

      <div className="mx-auto grid max-w-[1000px] grid-cols-1 gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <UploadDropzone value={image} onChange={setImage} />

        <div className="flex flex-col gap-3">
          <Field label="Title">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Tell everyone what your Pin is about"
              className={CONTROL_CLASS}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a detailed description"
              rows={4}
              className={`${CONTROL_CLASS} resize-none`}
            />
          </Field>

          <Field label="Link">
            <input
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Add a destination link"
              className={CONTROL_CLASS}
            />
          </Field>

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
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
