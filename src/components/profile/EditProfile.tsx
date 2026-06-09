"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { Avatar, Button, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/image";
import { requestEmailChange, requestPasswordReset } from "@/server/actions/account";
import { updateProfile } from "@/server/actions/profile";

/**
 * Maximum accepted avatar size after compression, matching the server action
 * body size limit.
 */
const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

/**
 * The gender values persisted on the user, matching the Prisma enum.
 */
type GenderValue = "FEMALE" | "MALE" | "NON_BINARY" | "UNDISCLOSED";

const GENDER_OPTIONS: { value: GenderValue; label: string }[] = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "NON_BINARY", label: "Non-binary" },
];

/**
 * Props for the {@link EditProfile} component.
 */
export type EditProfileProps = {
  name: string;
  username: string;
  bio: string;
  avatarUrl: string | null;
  email: string;
  gender: GenderValue | null;
  hasPassword: boolean;
};

/**
 * Account settings: a Profile column (avatar, username, name, bio, gender) and
 * an Account column (email change and password reset, both confirmed by email).
 * Saving the profile redirects to the user's page.
 *
 * @param props - The current profile and account values.
 * @returns The settings form element.
 */
export function EditProfile({
  name,
  username,
  bio,
  avatarUrl,
  email,
  gender,
  hasPassword,
}: EditProfileProps): ReactElement {
  const [displayName, setDisplayName] = useState(name);
  const [handle, setHandle] = useState(username);
  const [bioText, setBioText] = useState(bio);
  const [genderValue, setGenderValue] = useState<GenderValue | null>(gender);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileRef = useRef<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFile = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file !== undefined) {
      fileRef.current = file;
      setRemoveAvatar(false);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onRemovePhoto = (): void => {
    fileRef.current = null;
    setPreview(null);
    setRemoveAvatar(true);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("username", handle);
      formData.set("name", displayName);
      formData.set("bio", bioText);
      formData.set("gender", genderValue ?? "");
      if (removeAvatar) {
        formData.set("removeAvatar", "true");
      }
      if (fileRef.current !== null) {
        let file = fileRef.current;
        try {
          file = (await compressImage(file, 512, 0.85)).file;
        } catch {
          file = fileRef.current;
        }
        if (file.size > MAX_AVATAR_BYTES) {
          setError("Image is too large, even after compression.");
          return;
        }
        formData.set("avatar", file);
      }
      const result = await updateProfile(formData);
      setError(result.error);
    });
  };

  return (
    <div>
      <header className="-mx-6 mb-8 border-y border-line px-6 py-4">
        <h1 className="text-2xl font-bold text-ink">Edit profile</h1>
        <p className="mt-0.5 text-sm text-ink-soft">Manage your profile and account.</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <form onSubmit={onSubmit}>
          <h2 className="text-lg font-bold text-ink">Profile</h2>

          <div className="mt-5 flex items-center gap-4">
            <Avatar src={preview ?? undefined} name={displayName || handle} size={72} />
            <div className="flex flex-col items-start gap-2">
              <label className="cursor-pointer rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface">
                Change photo
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
              {preview !== null ? (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="text-sm font-medium text-ink-soft underline"
                >
                  Remove photo
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <Input
              label="Username"
              autoComplete="username"
              placeholder="yourname"
              value={handle}
              onChange={(event) =>
                setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
            />
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
            <Select
              label="Gender"
              value={genderValue ?? ""}
              onChange={(event) =>
                setGenderValue(
                  event.target.value === "" ? null : (event.target.value as GenderValue),
                )
              }
            >
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {error !== null ? (
            <p role="alert" className="mt-4 text-sm text-accent">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="mt-5" loading={pending}>
            Save changes
          </Button>
        </form>

        <AccountSection email={email} hasPassword={hasPassword} />
      </div>
    </div>
  );
}

/**
 * The Account column: change the email (confirmed via a link to the new
 * address) and trigger a password reset by email.
 *
 * @param props - The current email and whether the account has a password.
 * @returns The account section element.
 */
function AccountSection({
  email,
  hasPassword,
}: {
  email: string;
  hasPassword: boolean;
}): ReactElement {
  const [emailValue, setEmailValue] = useState(email);
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [emailPending, startEmail] = useTransition();
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdPending, startPwd] = useTransition();

  const emailChanged = emailValue.trim().toLowerCase() !== email.toLowerCase();

  const onVerifyEmail = (): void => {
    setEmailMsg(null);
    startEmail(async () => {
      const result = await requestEmailChange(emailValue);
      setEmailMsg(
        result.ok
          ? { ok: true, text: "Check your new inbox for a confirmation link." }
          : { ok: false, text: result.error },
      );
    });
  };

  const onResetPassword = (): void => {
    setPwdMsg(null);
    startPwd(async () => {
      const result = await requestPasswordReset();
      setPwdMsg(
        result.ok
          ? { ok: true, text: "We emailed you a link to set a new password." }
          : { ok: false, text: result.error },
      );
    });
  };

  return (
    <section className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
      <h2 className="text-lg font-bold text-ink">Account</h2>

      <div className="mt-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={emailValue}
          onChange={(event) => setEmailValue(event.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          className="mt-2.5"
          loading={emailPending}
          disabled={!emailChanged || emailValue.trim() === ""}
          onClick={onVerifyEmail}
        >
          Verify new email
        </Button>
        {emailMsg !== null ? (
          <p className={cn("mt-2 text-sm", emailMsg.ok ? "text-ink-soft" : "text-accent")}>
            {emailMsg.text}
          </p>
        ) : null}
      </div>

      {hasPassword ? (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="text-sm font-bold text-ink">Password</h3>
          <p className="mt-1 text-sm text-ink-soft">
            We&rsquo;ll email you a secure link to choose a new password.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            loading={pwdPending}
            onClick={onResetPassword}
          >
            Change password
          </Button>
          {pwdMsg !== null ? (
            <p className={cn("mt-2 text-sm", pwdMsg.ok ? "text-ink-soft" : "text-accent")}>
              {pwdMsg.text}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
