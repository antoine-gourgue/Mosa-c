"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input } from "@/components/ui";
import { Logo } from "@/icons";
import { registerUser, signInWithProvider } from "@/server/actions/auth";

/**
 * Sign-up screen: the right-hand form collecting email, password and age, with
 * social sign-in, legal text and a link to log in. On submit it registers the
 * account (the onboarding gender step is inserted before this in a later
 * ticket) and the server redirects to the feed.
 *
 * @returns The sign-up form element.
 */
export function SignUp(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await registerUser({ email, password, age: Number(age) });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? null);
      }
    });
  };

  const handleOAuth = (provider: "google" | "apple"): void => {
    startTransition(async () => {
      await signInWithProvider(provider);
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

      <h1 className="text-3xl font-extrabold text-ink">Find your next idea</h1>
      <p className="mt-2 text-ink-soft">Sign up to discover and save ideas you love.</p>

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
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <Input
          label="Age"
          type="number"
          placeholder="Your age"
          value={age}
          onChange={(event) => setAge(event.target.value)}
          error={errors.age}
        />
        {formError !== null ? (
          <p role="alert" className="text-sm text-accent">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={pending}>
          Continue
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-sm text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        OR
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="social" fullWidth onClick={() => handleOAuth("google")}>
          Continue with Google
        </Button>
        <Button variant="social" fullWidth onClick={() => handleOAuth("apple")}>
          Continue with Apple
        </Button>
      </div>

      <p className="mt-6 text-xs text-ink-faint">
        By continuing, you agree to Mosaic&rsquo;s Terms of Service and acknowledge our Privacy
        Policy.
      </p>
      <p className="mt-4 text-sm text-ink-soft">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
