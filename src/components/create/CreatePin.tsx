"use client";

import { useState } from "react";
import type { ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { UploadDropzone } from "./UploadDropzone";

/**
 * Create Pin form: an upload area on the left and the pin details (title,
 * description, link, board) with a Publish button on the right. Uploading and
 * publishing are wired in later tickets.
 *
 * @returns The create pin form element.
 */
export function CreatePin(): ReactElement {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [board, setBoard] = useState("Quick Saves");

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-[32px] font-extrabold text-ink">Create Pin</h1>
      <p className="mt-1 text-ink-soft">Add an image and a few details to share your idea.</p>
      <div className="mt-7 grid grid-cols-1 gap-7 md:grid-cols-2">
        <UploadDropzone file={file} onSelect={setFile} />
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
          <Button fullWidth className="mt-2">
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
