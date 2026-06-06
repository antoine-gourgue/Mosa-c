"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { updateProfile } from "@/server/actions/profile";

/**
 * Props for the {@link EditProfile} component.
 */
export type EditProfileProps = {
  name: string;
  bio: string;
  avatarUrl: string | null;
};

/**
 * Edit-profile form: avatar, display name and bio, wired to the update action.
 * Saving redirects to the profile.
 *
 * @param props - The current profile values.
 * @returns The edit profile form element.
 */
export function EditProfile({ name, bio, avatarUrl }: EditProfileProps): ReactElement {
  const [displayName, setDisplayName] = useState(name);
  const [bioText, setBioText] = useState(bio);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const fileRef = useRef<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      fileRef.current = file;
      setPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("name", displayName);
    formData.set("bio", bioText);
    if (fileRef.current !== null) {
      formData.set("avatar", fileRef.current);
    }
    setError(null);
    startTransition(async () => {
      const result = await updateProfile(formData);
      setError(result.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4 py-8">
      <h1 className="text-3xl font-extrabold text-ink">Edit profile</h1>

      <label className="flex cursor-pointer flex-col items-center gap-2">
        <span
          role="img"
          aria-label="Avatar preview"
          style={preview !== null ? { backgroundImage: `url(${preview})` } : undefined}
          className="size-24 rounded-full bg-surface-2 bg-cover bg-center ring-1 ring-line"
        />
        <span className="text-sm font-semibold text-ink-soft">Change photo</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} />
      </label>

      <Input
        label="Name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="Your name"
      />
      <Textarea
        label="Bio"
        value={bioText}
        onChange={(event) => setBioText(event.target.value)}
        placeholder="Tell people about yourself"
        rows={3}
      />
      {error !== null ? (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      ) : null}
      <Button type="submit" fullWidth loading={pending}>
        Save
      </Button>
    </form>
  );
}
