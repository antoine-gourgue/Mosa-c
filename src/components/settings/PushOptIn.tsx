"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";
import type { ReactElement } from "react";
import { Button, Toggle, useToast } from "@/components/ui";
import { deletePushSubscription, savePushSubscription, sendTestPush } from "@/server/actions/push";

/**
 * Converts a base64url VAPID public key to the Uint8Array the Push API expects.
 *
 * @param base64 - The URL-safe base64 VAPID public key.
 * @returns The decoded key bytes.
 */
function vapidKeyToBytes(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/**
 * Opt-in control for browser push notifications. Subscribes the device through
 * the service worker's Push Manager, persists the subscription server-side and
 * offers a test push; toggling off unsubscribes and removes the record. Renders
 * an explanatory disabled state when the browser lacks support or Web Push is
 * not configured.
 *
 * @returns The push opt-in element.
 */
export function PushOptIn(): ReactElement {
  const t = useTranslations("settings");
  const { show } = useToast();
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const sync = async (): Promise<void> => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || vapidKey === "") {
        if (!cancelled) {
          setSupported(false);
        }
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!cancelled) {
        setEnabled(subscription !== null);
      }
    };
    void sync().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [vapidKey]);

  const enable = (): void => {
    startTransition(async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          show({ title: t("pushBlocked") });
          return;
        }
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyToBytes(vapidKey) as BufferSource,
        });
        const result = await savePushSubscription(
          subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } },
        );
        if (!result.ok) {
          show({ title: t("pushFailed") });
          return;
        }
        setEnabled(true);
      } catch {
        show({ title: t("pushFailed") });
      }
    });
  };

  const disable = (): void => {
    startTransition(async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription !== null) {
          await subscription.unsubscribe();
          await deletePushSubscription(subscription.endpoint);
        }
        setEnabled(false);
      } catch {
        show({ title: t("pushFailed") });
      }
    });
  };

  const test = (): void => {
    startTransition(async () => {
      const result = await sendTestPush();
      show({ title: result.ok ? t("pushTestSent") : t("pushFailed") });
    });
  };

  if (!supported) {
    return <p className="text-sm text-ink-soft">{t("pushUnsupported")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 py-2">
        <span className="min-w-0">
          <span className="block text-[15px] font-medium text-ink">{t("pushEnable")}</span>
          <span className="block text-sm text-ink-soft">{t("pushHint")}</span>
        </span>
        <Toggle
          checked={enabled}
          onChange={enabled ? disable : enable}
          disabled={pending}
          label={t("pushEnable")}
        />
      </div>
      {enabled ? (
        <div>
          <Button variant="ghost" size="sm" disabled={pending} onClick={test}>
            {t("pushTest")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
