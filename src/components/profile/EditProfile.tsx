"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import { Avatar, Button, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { compressImage } from "@/lib/image";
import {
  getAccountStatus,
  requestEmailChange,
  requestPasswordReset,
} from "@/server/actions/account";
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

const GENDER_OPTIONS: { value: GenderValue; key: "female" | "male" | "nonBinary" }[] = [
  { value: "FEMALE", key: "female" },
  { value: "MALE", key: "male" },
  { value: "NON_BINARY", key: "nonBinary" },
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
  emailVerified: boolean;
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
  emailVerified,
  gender,
  hasPassword,
}: EditProfileProps): ReactElement {
  const t = useTranslations("settings");
  const tf = useTranslations("fields");
  const tg = useTranslations("gender");
  const [displayName, setDisplayName] = useState(name);
  const [handle, setHandle] = useState(username);
  const [bioText, setBioText] = useState(bio);
  const [genderValue, setGenderValue] = useState<GenderValue | null>(
    gender === "UNDISCLOSED" ? null : gender,
  );
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
          setError(t("avatarTooLarge"));
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
        <h1 className="text-2xl font-bold text-ink">{t("title")}</h1>
        <p className="mt-0.5 text-sm text-ink-soft">{t("subtitle")}</p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        <form onSubmit={onSubmit}>
          <h2 className="text-lg font-bold text-ink">{t("profile")}</h2>

          <div className="mt-5 flex items-center gap-4">
            <Avatar src={preview ?? undefined} name={displayName || handle} size={72} />
            <div className="flex flex-col items-start gap-2">
              <label className="cursor-pointer rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface">
                {t("changePhoto")}
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
              </label>
              {preview !== null ? (
                <button
                  type="button"
                  onClick={onRemovePhoto}
                  className="text-sm font-medium text-ink-soft underline"
                >
                  {t("removePhoto")}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <Input
              label={tf("username")}
              autoComplete="username"
              placeholder={t("usernamePlaceholder")}
              value={handle}
              onChange={(event) =>
                setHandle(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
            />
            <Input
              label={tf("name")}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("namePlaceholder")}
            />
            <Textarea
              label={tf("bio")}
              value={bioText}
              onChange={(event) => setBioText(event.target.value)}
              placeholder={t("bioPlaceholder")}
              rows={3}
            />
            <Select
              label={tf("gender")}
              value={genderValue ?? ""}
              onChange={(event) =>
                setGenderValue(
                  event.target.value === "" ? null : (event.target.value as GenderValue),
                )
              }
            >
              <option value="">{tg("preferNotToSay")}</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {tg(option.key)}
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
            {t("save")}
          </Button>
        </form>

        <AccountSection email={email} emailVerified={emailVerified} hasPassword={hasPassword} />
      </div>
    </div>
  );
}

/**
 * How often, in milliseconds, the account status is polled while a confirmation
 * link is outstanding, so a click in the new inbox is reflected here.
 */
const STATUS_POLL_MS = 4000;

/**
 * How long, in milliseconds, to keep polling before giving up — matching the
 * confirmation link's lifetime, after which polling would be pointless.
 */
const STATUS_POLL_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * The Account column: change the email (confirmed via a link to the new
 * address) and trigger a password reset by email.
 *
 * @param props - The current email, its verified state, and whether the account
 *   has a password.
 * @returns The account section element.
 */
function AccountSection({
  email,
  emailVerified,
  hasPassword,
}: {
  email: string;
  emailVerified: boolean;
  hasPassword: boolean;
}): ReactElement {
  const t = useTranslations("settings.account");
  const tf = useTranslations("fields");
  const [currentEmail, setCurrentEmail] = useState(email);
  const [verified, setVerified] = useState(emailVerified);
  const [emailValue, setEmailValue] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailPending, startEmail] = useTransition();
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwdPending, startPwd] = useTransition();

  const emailChanged = emailValue.trim().toLowerCase() !== currentEmail.toLowerCase();

  useEffect(() => {
    if (pendingEmail === null) {
      return;
    }
    const deadline = Date.now() + STATUS_POLL_TIMEOUT_MS;
    const id = setInterval(async () => {
      if (Date.now() > deadline) {
        setPendingEmail(null);
        setEmailError(t("linkExpired"));
        return;
      }
      const status = await getAccountStatus();
      if (status.ok && status.email.toLowerCase() === pendingEmail) {
        setCurrentEmail(status.email);
        setVerified(status.emailVerified);
        setEmailValue(status.email);
        setPendingEmail(null);
      }
    }, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [pendingEmail, t]);

  const onVerifyEmail = (): void => {
    setEmailError(null);
    startEmail(async () => {
      const result = await requestEmailChange(emailValue, currentPassword);
      if (result.ok) {
        setPendingEmail(emailValue.trim().toLowerCase());
        setCurrentPassword("");
      } else {
        setEmailError(result.error);
      }
    });
  };

  const onResetPassword = (): void => {
    setPwdMsg(null);
    startPwd(async () => {
      const result = await requestPasswordReset();
      setPwdMsg(
        result.ok ? { ok: true, text: t("passwordSent") } : { ok: false, text: result.error },
      );
    });
  };

  return (
    <section className="border-t border-line pt-8 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
      <h2 className="text-lg font-bold text-ink">{t("title")}</h2>

      <div className="mt-5">
        <Input
          label={tf("email")}
          type="email"
          autoComplete="email"
          value={emailValue}
          onChange={(event) => setEmailValue(event.target.value)}
        />
        <div
          className={cn(
            "mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
            pendingEmail === null && verified
              ? "bg-success/10 text-success"
              : "bg-accent/10 text-accent",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-sm",
              pendingEmail === null && verified ? "bg-success" : "bg-accent",
            )}
          />
          <span>
            {pendingEmail !== null
              ? t("pending", { email: pendingEmail })
              : verified
                ? t("verified")
                : t("notVerified")}
          </span>
        </div>
        {hasPassword && emailChanged ? (
          <div className="mt-3">
            <Input
              label={t("currentPassword")}
              type="password"
              autoComplete="current-password"
              placeholder={t("currentPasswordPlaceholder")}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          className="mt-2.5"
          loading={emailPending}
          disabled={
            !emailChanged || emailValue.trim() === "" || (hasPassword && currentPassword === "")
          }
          onClick={onVerifyEmail}
        >
          {t("changeEmail")}
        </Button>
        {emailError !== null ? <p className="mt-2 text-sm text-accent">{emailError}</p> : null}
      </div>

      {hasPassword ? (
        <div className="mt-6 border-t border-line pt-6">
          <h3 className="text-sm font-bold text-ink">{t("passwordHeading")}</h3>
          <p className="mt-1 text-sm text-ink-soft">{t("passwordHint")}</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3"
            loading={pwdPending}
            onClick={onResetPassword}
          >
            {t("changePassword")}
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
