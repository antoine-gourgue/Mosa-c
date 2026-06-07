"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { compressImage } from "@/lib/image";
import { createPin } from "@/server/actions/pins";
import { UploadDropzone } from "./UploadDropzone";
import type { SelectedImage } from "./UploadDropzone";

/**
 * Maximum accepted image size, matching the server action body size limit.
 */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * A board option for the create form's board selector.
 */
export type BoardOption = {
  id: string;
  name: string;
};

/**
 * Props for the {@link CreatePin} component.
 */
export type CreatePinProps = {
  boards: BoardOption[];
};

/**
 * Create Pin form: an upload area on the left and the pin details (title,
 * description, link and a board selector) with a Publish button on the right.
 * Publishing stores the image, persists the pin and redirects to the board.
 *
 * @param props - The user's boards for the selector.
 * @returns The create pin form element.
 */
export function CreatePin({ boards }: CreatePinProps): ReactElement {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
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

  return (
    <div className="mx-auto max-w-[940px]">
      <h1 className="text-[32px] font-extrabold text-ink">Create Pin</h1>
      <p className="mt-1 text-ink-soft">Add an image and a few details to share your idea.</p>
      <div className="mt-6 rounded-[28px] border border-line bg-bg p-5 shadow-pop md:p-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,400px)_1fr]">
          <UploadDropzone value={image} onChange={setImage} />
          <div className="flex flex-col gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Add a title"
            />
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is your Pin about?"
              rows={4}
            />
            <Input
              label="Link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="Add a destination link"
            />
            <Select label="Board" value={board} onChange={(event) => setBoard(event.target.value)}>
              {boards.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </Select>
            <div className="mt-auto pt-2">
              {error !== null ? (
                <p role="alert" className="mb-2 text-sm text-accent">
                  {error}
                </p>
              ) : null}
              <Button fullWidth loading={pending} onClick={onPublish}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
