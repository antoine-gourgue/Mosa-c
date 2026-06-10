"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { Logo } from "@/icons";
import { confirmEmailChange } from "@/server/actions/account";

/**
 * Props for {@link ConfirmEmail}.
 */
export type ConfirmEmailProps = {
  token: string;
};

/**
 * Confirms a pending email change from the link, applying it on arrival. The
 * token is single-use, so a ref guards against React's double-invoked effect.
 *
 * @param props - The token from the confirmation link.
 * @returns The confirmation status element.
 */
export function ConfirmEmail({ token }: ConfirmEmailProps): ReactElement {
  const t = useTranslations("auth.confirmEmail");
  const ran = useRef(false);
  const [state, setState] = useState<"loading" | "ok" | "error">(
    token === "" ? "error" : "loading",
  );
  const [error, setError] = useState(t("invalidError"));

  useEffect(() => {
    if (ran.current || token === "") {
      return;
    }
    ran.current = true;
    confirmEmailChange(token)
      .then((result) => {
        if (result.ok) {
          setState("ok");
        } else {
          setError(result.error);
          setState("error");
        }
      })
      .catch(() => {
        setError(t("genericError"));
        setState("error");
      });
  }, [token]);

  return (
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-accent text-bg">
        <Logo size={26} />
      </span>
      {state === "loading" ? (
        <>
          <h1 className="mt-6 text-2xl font-extrabold text-ink">{t("loadingTitle")}</h1>
          <p className="mt-2 text-ink-soft">{t("loadingBody")}</p>
        </>
      ) : state === "ok" ? (
        <>
          <h1 className="mt-6 text-2xl font-extrabold text-ink">{t("okTitle")}</h1>
          <p className="mt-2 text-ink-soft">{t("okBody")}</p>
        </>
      ) : (
        <>
          <h1 className="mt-6 text-2xl font-extrabold text-ink">{t("errorTitle")}</h1>
          <p className="mt-2 text-ink-soft">{error}</p>
          <p className="mt-4 text-sm text-ink-soft">
            <Link href="/settings/profile" className="font-semibold text-ink underline">
              {t("tryAgain")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
