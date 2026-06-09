"use client";

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
};

/**
 * Email verification screen: the user enters the 6-digit code sent to their
 * address. A correct code both verifies the account and signs them in (the
 * server redirects to the feed); a resend link re-sends a throttled code.
 *
 * @param props - The email being verified.
 * @returns The verification form element.
 */
export function VerifyEmail({ email }: VerifyEmailProps): ReactElement {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (email === "") {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Verify your email</h1>
        <p className="mt-2 text-ink-soft">
          We couldn&apos;t tell which email to verify.{" "}
          <Link href="/sign-up" className="font-semibold text-ink underline">
            Start sign-up
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
        setError(result.formError ?? "That code is invalid or has expired.");
      }
    });
  };

  const handleResend = (): void => {
    setError(null);
    startTransition(async () => {
      await resendOtp(email);
      setNotice("If your email needs verifying, a new code is on its way.");
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

      <h1 className="text-3xl font-extrabold text-ink">Check your inbox</h1>
      <p className="mt-2 text-ink-soft">
        We sent a 6-digit code to <span className="font-semibold text-ink">{email}</span>. Enter it
        below to finish creating your account.
      </p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Verification code"
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
          Verify
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-ink-soft">
        <button type="button" onClick={handleResend} className="font-semibold text-ink underline">
          Resend code
        </button>
        <Link href="/sign-up" className="underline">
          Wrong email?
        </Link>
      </div>
    </div>
  );
}
