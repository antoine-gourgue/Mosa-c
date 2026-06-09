"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/icons";
import { requestPasswordResetForEmail } from "@/server/actions/account";

/**
 * Forgot-password screen: enter an email to receive a reset link. Always reports
 * success so it never reveals whether an account exists.
 *
 * @returns The forgot-password form element.
 */
export function ForgotPassword(): ReactElement {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    startTransition(async () => {
      await requestPasswordResetForEmail(email);
      setSent(true);
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-xl font-bold text-accent">Mosaic</span>
      </div>

      <h1 className="text-3xl font-extrabold text-ink">Forgot your password?</h1>
      <p className="mt-2 text-ink-soft">
        Enter your email and we&rsquo;ll send you a link to reset it.
      </p>

      {sent ? (
        <p className="mt-6 text-ink-soft">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" fullWidth loading={pending}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
