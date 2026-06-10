import type messages from "../messages/en.json";
import type { Locale } from "./i18n/config";

/**
 * Augments next-intl so `useTranslations`/`getTranslations` keys and the active
 * locale are type-checked against the English catalogue (the source of truth).
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof messages;
    Locale: Locale;
  }
}
