"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent, ReactElement } from "react";
import { Button, Input, Select } from "@/components/ui";
import { GoogleIcon, Logo } from "@/icons";
import { registerUser, signInWithProvider } from "@/server/actions/auth";

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
 * Single-step sign-up form: username, email, password, age and an optional
 * gender, plus Google. On success the server emails a code and the user is sent
 * to the verification step; field errors are surfaced inline.
 *
 * @returns The sign-up form element.
 */
export function SignUp(): ReactElement {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<GenderValue | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    startTransition(async () => {
      const result = await registerUser({
        username,
        email,
        password,
        age: Number(age),
        gender: gender ?? undefined,
      });
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
      <div className="mb-5 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-accent text-bg">
          <Logo size={20} />
        </span>
        <span className="text-xl font-bold text-accent">Mosaic</span>
      </div>

      <h1 className="text-2xl font-extrabold text-ink">Find your next idea</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Sign up to discover and save ideas you love.</p>

      <form className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit} noValidate>
        <Input
          label="Username"
          autoComplete="username"
          placeholder="yourname"
          value={username}
          onChange={(event) =>
            setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
          }
          error={errors.username}
        />
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
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Age"
            type="number"
            placeholder="Your age"
            value={age}
            onChange={(event) => setAge(event.target.value)}
            error={errors.age}
          />
          <Select
            label="Gender"
            value={gender ?? ""}
            onChange={(event) =>
              setGender(event.target.value === "" ? null : (event.target.value as GenderValue))
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

        {formError !== null ? (
          <p role="alert" className="text-sm text-accent">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth loading={pending}>
          Create account
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3 text-sm text-ink-soft">
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

      <p className="mt-5 text-xs text-ink-soft">
        By continuing, you agree to Mosaic&rsquo;s Terms of Service and acknowledge our Privacy
        Policy.
      </p>
      <p className="mt-3 text-sm text-ink-soft">
        Already a member?{" "}
        <Link href="/login" className="font-semibold text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
