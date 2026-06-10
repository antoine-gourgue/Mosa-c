import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "./locale";

/**
 * Per-request i18n config consumed by next-intl: resolves the locale and loads
 * its message catalogue. Wired through the next-intl plugin in `next.config.ts`.
 */
export default getRequestConfig(async () => {
  const locale = await getUserLocale();
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
