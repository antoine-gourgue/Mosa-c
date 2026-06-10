"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/icons";
import { resendOtp, verifyOtp } from "@/server/actions/auth";

/**
 * Props for {@link VerifyEmail}.
 */
export type VerifyEmailProps = {
  email: string;
  initialCode?: string;
};

/**
 * Email verification screen: the user enters the 6-digit code sent to their
 * address. A correct code both verifies the account and signs them in (the
 * server redirects to the feed); a resend link re-sends a throttled code.
 *
 * @param props - The email being verified.
 * @returns The verification form element.
 */
export function VerifyEmail({ email, initialCode = "" }: VerifyEmailProps): ReactElement {
  const t = useTranslations("auth.verifyEmail");
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (email === "") {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{t("missingTitle")}</h1>
        <p className="mt-2 text-ink-soft">
          {t("missingBody")}{" "}
          <Link href="/sign-up" className="font-semibold text-ink underline">
            {t("startSignUp")}
          </Link>
          .
        </p>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await verifyOtp(email, code);
      if (!result.ok) {
        setError(result.formError ?? t("invalidCode"));
      }
    });
  };

  const handleResend = (): void => {
    setError(null);
    startTransition(async () => {
      await resendOtp(email);
      setNotice(t("resent"));
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-xl font-bold text-accent">Mosaic</span>
      </div>

      <h1 className="text-3xl font-extrabold text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">
        {t.rich("subtitle", {
          email,
          b: (chunks) => <span className="font-semibold text-ink">{chunks}</span>,
        })}
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label={t("codeLabel")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
          error={error ?? undefined}
        />
        {notice !== null ? <p className="text-sm text-ink-soft">{notice}</p> : null}
        <Button type="submit" fullWidth loading={pending} disabled={code.length !== 6}>
          {t("submit")}
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-ink-soft">
        <button type="button" onClick={handleResend} className="font-semibold text-ink underline">
          {t("resend")}
        </button>
        <Link href="/sign-up" className="underline">
          {t("wrongEmail")}
        </Link>
      </div>
    </div>
  );
}
