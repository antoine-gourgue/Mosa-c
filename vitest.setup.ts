import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

process.env.DATABASE_URL ??= "postgresql://localhost:5432/test";
process.env.AUTH_SECRET ??= "test-secret";

vi.mock("next-intl", async () => {
  const en = (await import("./messages/en.json")).default as unknown as Record<string, unknown>;
  const resolve = (namespace: string, key: string): string => {
    const ns = namespace
      .split(".")
      .reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en);
    const value = (ns as Record<string, unknown>)?.[key];
    return typeof value === "string" ? value : key;
  };
  const useTranslations = (
    namespace = "",
  ): ((key: string, values?: Record<string, string>) => string) => {
    const t = (key: string, values?: Record<string, string>): string => {
      let message = resolve(namespace, key);
      for (const [name, value] of Object.entries(values ?? {})) {
        message = message.replace(`{${name}}`, value);
      }
      return message;
    };
    return t;
  };
  return {
    useTranslations,
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: unknown }) => children,
  };
});

afterEach(() => {
  cleanup();
});

if (typeof window !== "undefined" && window.matchMedia === undefined) {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: query.includes("reduce"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}
