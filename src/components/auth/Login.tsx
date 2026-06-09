"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { GoogleIcon, Logo } from "@/icons";
import { loginUser, signInWithProvider } from "@/server/actions/auth";

/**
 * Login screen for returning users: an email/password form wired to the login
 * action, with a friendly error on bad credentials and a link to sign up. The
 * server redirects to the feed on success.
 *
 * @returns The login form element.
 */
export function Login(): ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await loginUser({ email, password });
      if (!result.ok && result.needsVerification === true) {
        router.push(`/verify?email=${encodeURIComponent(result.email ?? email)}`);
        return;
      }
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? null);
      }
    });
  };

  const handleGoogle = (): void => {
    startTransition(async () => {
      await signInWithProvider("google");
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

      <h1 className="text-3xl font-extrabold text-ink">Welcome back</h1>
      <p className="mt-2 text-ink-soft">Log in to pick up where you left off.</p>

      <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <div className="-mt-1 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Forgot password?
          </Link>
        </div>
        {formError !== null ? (
          <p role="alert" className="text-sm text-accent">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={pending}>
          Log in
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm text-ink-soft">
        <span className="h-px flex-1 bg-line" />
        OR
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button variant="social" fullWidth onClick={handleGoogle}>
        <span className="inline-flex items-center gap-2.5">
          <GoogleIcon size={18} />
          Continue with Google
        </span>
      </Button>

      <p className="mt-6 text-sm text-ink-soft">
        New to Mosaic?{" "}
        <Link href="/sign-up" className="font-semibold text-ink underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
