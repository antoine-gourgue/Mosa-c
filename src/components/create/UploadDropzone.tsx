"use client";

import type { ChangeEvent, ReactElement } from "react";
import { PlusIcon } from "@/icons";

/**
 * Props for the {@link UploadDropzone} component.
 */
export type UploadDropzoneProps = {
  file: File | null;
  onSelect: (file: File | null) => void;
};

/**
 * Upload area for the create form. This base version selects a file by click;
 * drag-and-drop, preview and validation are added in a later ticket.
 *
 * @param props - The selected file and the selection handler.
 * @returns The upload area element.
 */
export function UploadDropzone({ file, onSelect }: UploadDropzoneProps): ReactElement {
  const onChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onSelect(event.target.files?.[0] ?? null);
  };

  return (
    <label className="block cursor-pointer">
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      <div className="grid min-h-[360px] place-items-center rounded-3xl border-2 border-dashed border-surface-3 bg-surface p-6 text-center text-ink-soft">
        <div>
          <PlusIcon size={34} className="mx-auto" />
          <div className="mt-2 font-semibold">{file === null ? "Choose a file" : file.name}</div>
          <div className="mt-1 text-sm">We recommend high-quality .jpg or .png</div>
        </div>
      </div>
    </label>
  );
}
