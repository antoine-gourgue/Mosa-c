import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail, sendOtpEmail } from "./email";

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const message = { to: "a@x.com", subject: "Hi", html: "<p>hi</p>", text: "hi" };

describe("sendEmail", () => {
  it("logs to the console and succeeds when Resend is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    expect(await sendEmail(message)).toBe(true);
    expect(info).toHaveBeenCalled();
  });

  it("posts to the Resend API when configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("EMAIL_FROM", "Mosaic <noreply@send.x.com>");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(message)).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false when the Resend request throws", async () => {
    vi.stubEnv("RESEND_API_KEY", "key");
    vi.stubEnv("EMAIL_FROM", "Mosaic <noreply@send.x.com>");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await sendEmail(message)).toBe(false);
  });
});

describe("sendOtpEmail", () => {
  it("includes the code in the message", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    expect(await sendOtpEmail("a@x.com", "123456")).toBe(true);
    expect(info.mock.calls[0]?.[0]).toContain("123456");
  });
});
