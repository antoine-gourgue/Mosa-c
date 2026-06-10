import { getTranslations } from "next-intl/server";

/**
 * Resolves a localized error message from the `errors` catalogue, for server
 * actions to return in their failure results. Reads the request locale so the
 * message matches the caller's language.
 *
 * @param key - The key within the `errors` namespace.
 * @returns The localized message.
 */
export async function errorMessage(key: string): Promise<string> {
  const t = await getTranslations("errors");
  return t(key as Parameters<typeof t>[0]);
}
