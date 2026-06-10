"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("auth.forgotPassword");
  const tf = useTranslations("fields");
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

      <h1 className="text-3xl font-extrabold text-ink">{t("title")}</h1>
      <p className="mt-2 text-ink-soft">{t("subtitle")}</p>

      {sent ? (
        <div className="mt-6 flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-sm text-success">
          <span aria-hidden className="mt-1 size-2 shrink-0 rounded-sm bg-success" />
          <span>{t("sent")}</span>
        </div>
      ) : (
        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Input
            label={tf("email")}
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button type="submit" fullWidth loading={pending}>
            {t("submit")}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        {t("remembered")}{" "}
        <Link href="/login" className="font-semibold text-ink underline">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
