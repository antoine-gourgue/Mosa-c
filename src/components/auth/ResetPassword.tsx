"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/icons";
import { resetPassword } from "@/server/actions/account";

/**
 * Props for {@link ResetPassword}.
 */
export type ResetPasswordProps = {
  token: string;
};

/**
 * Set-a-new-password screen reached from a reset link. Validates the token via
 * the action and, on success, sends the user to log in.
 *
 * @param props - The token from the reset link.
 * @returns The reset form element.
 */
export function ResetPassword({ token }: ResetPasswordProps): ReactElement {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (token === "") {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Invalid link</h1>
        <p className="mt-2 text-ink-soft">
          This reset link is missing or invalid.{" "}
          <Link href="/forgot-password" className="font-semibold text-ink underline">
            Request a new one
          </Link>
          .
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Password updated</h1>
        <p className="mt-2 text-ink-soft">You can now sign in with your new password.</p>
        <Button href="/login" className="mt-6">
          Go to login
        </Button>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    startTransition(async () => {
      try {
        const result = await resetPassword(token, password);
        if (result.ok) {
          setDone(true);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong. Please try again.");
      }
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

      <h1 className="text-3xl font-extrabold text-ink">Choose a new password</h1>
      <p className="mt-2 text-ink-soft">Pick a password you don&rsquo;t use anywhere else.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
        {error !== null ? (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={pending}>
          Update password
        </Button>
      </form>
    </div>
  );
}
