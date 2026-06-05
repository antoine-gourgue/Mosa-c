"use client";

import { useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { createPin } from "@/server/actions/pins";
import { UploadDropzone } from "./UploadDropzone";
import type { SelectedImage } from "./UploadDropzone";

/**
 * Create Pin form: an upload area on the left and the pin details (title,
 * description, link, board) with a Publish button on the right. Publishing
 * stores the image, persists the pin and redirects to the board.
 *
 * @returns The create pin form element.
 */
export function CreatePin(): ReactElement {
  const [image, setImage] = useState<SelectedImage | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [board, setBoard] = useState("Quick Saves");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onPublish = (): void => {
    if (image === null) {
      setError("Please add an image.");
      return;
    }
    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("link", link);
    formData.set("board", board);
    formData.set("width", String(image.width));
    formData.set("height", String(image.height));
    formData.set("image", image.file);
    setError(null);
    startTransition(async () => {
      const result = await createPin(formData);
      setError(result.error);
    });
  };

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-[32px] font-extrabold text-ink">Create Pin</h1>
      <p className="mt-1 text-ink-soft">Add an image and a few details to share your idea.</p>
      <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-2">
        <UploadDropzone value={image} onChange={setImage} />
        <div className="flex flex-col gap-4">
          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a title"
          />
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is your Pin about?"
          />
          <Input
            label="Link"
            value={link}
            onChange={(event) => setLink(event.target.value)}
            placeholder="Add a destination link"
          />
          <Input label="Board" value={board} onChange={(event) => setBoard(event.target.value)} />
          {error !== null ? (
            <p role="alert" className="text-sm text-accent">
              {error}
            </p>
          ) : null}
          <Button fullWidth className="mt-2" loading={pending} onClick={onPublish}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
