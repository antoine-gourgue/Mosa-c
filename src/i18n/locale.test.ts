import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

import { cookies, headers } from "next/headers";
import { getUserLocale } from "./locale";

const setRequest = (cookie: string | undefined, acceptLanguage: string): void => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => (cookie === undefined ? undefined : { value: cookie }),
  } as never);
  vi.mocked(headers).mockResolvedValue({
    get: () => acceptLanguage,
  } as never);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserLocale", () => {
  it("prefers a valid cookie over the header", async () => {
    setRequest("fr", "en-US,en;q=0.9");
    expect(await getUserLocale()).toBe("fr");
  });

  it("falls back to the Accept-Language header when there is no cookie", async () => {
    setRequest(undefined, "fr-FR,fr;q=0.9,en;q=0.8");
    expect(await getUserLocale()).toBe("fr");
  });

  it("ignores an unsupported cookie and uses the header", async () => {
    setRequest("de", "fr;q=0.9");
    expect(await getUserLocale()).toBe("fr");
  });

  it("defaults to en when nothing matches", async () => {
    setRequest(undefined, "de-DE,es;q=0.9");
    expect(await getUserLocale()).toBe("en");
  });
});
