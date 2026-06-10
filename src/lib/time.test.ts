import { afterEach, describe, expect, it, vi } from "vitest";
import enMessages from "../../messages/en.json";
import {
  formatClockTime,
  formatLastActive,
  formatMessageSeparator,
  formatRelativeTime,
  shouldSeparateMessages,
  type TimeTranslator,
} from "./time";

const TIME = enMessages.time as Record<string, string>;

/**
 * English translator backed by the catalogue, so assertions read the real copy.
 */
const t: TimeTranslator = (key, values) => {
  let message = TIME[key] ?? key;
  for (const [name, value] of Object.entries(values ?? {})) {
    message = message.replace(`{${name}}`, String(value));
  }
  return message;
};

describe("formatLastActive", () => {
  const minutesAgo = (n: number): string => new Date(Date.now() - n * 60000).toISOString();

  it("returns null without a timestamp", () => {
    expect(formatLastActive(null, t)).toBeNull();
  });

  it("formats minutes up to 59", () => {
    expect(formatLastActive(minutesAgo(5), t)).toBe("active 5m ago");
    expect(formatLastActive(minutesAgo(59), t)).toBe("active 59m ago");
  });

  it("formats hours up to 12", () => {
    expect(formatLastActive(minutesAgo(90), t)).toBe("active 1h ago");
    expect(formatLastActive(minutesAgo(12 * 60), t)).toBe("active 12h ago");
  });

  it("returns null beyond 12 hours", () => {
    expect(formatLastActive(minutesAgo(13 * 60), t)).toBeNull();
  });
});

describe("shouldSeparateMessages", () => {
  it("separates the first message", () => {
    expect(shouldSeparateMessages(null, "2026-06-07T10:00:00Z")).toBe(true);
  });

  it("does not separate messages within an hour on the same day", () => {
    expect(shouldSeparateMessages("2026-06-07T10:00:00Z", "2026-06-07T10:30:00Z")).toBe(false);
  });

  it("separates after a gap of more than an hour", () => {
    expect(shouldSeparateMessages("2026-06-07T10:00:00Z", "2026-06-07T11:30:00Z")).toBe(true);
  });

  it("separates across different days", () => {
    expect(shouldSeparateMessages("2026-06-07T10:00:00Z", "2026-06-09T10:00:00Z")).toBe(true);
  });
});

describe("formatClockTime", () => {
  it("formats an ISO timestamp as hours and minutes", () => {
    expect(formatClockTime("2026-06-07T14:32:00Z", "en")).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe("formatMessageSeparator", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels today's messages with `Today`", () => {
    vi.setSystemTime(new Date("2026-06-09T18:00:00Z"));
    expect(formatMessageSeparator("2026-06-09T09:00:00Z", t, "en")).toMatch(/^Today /);
  });

  it("labels yesterday's messages with `Yesterday`", () => {
    vi.setSystemTime(new Date("2026-06-09T18:00:00Z"));
    expect(formatMessageSeparator("2026-06-08T09:00:00Z", t, "en")).toMatch(/^Yesterday /);
  });

  it("labels an older same-year date without the year", () => {
    vi.setSystemTime(new Date("2026-06-09T18:00:00Z"));
    const label = formatMessageSeparator("2026-03-02T09:00:00Z", t, "en");
    expect(label).not.toMatch(/^Today |^Yesterday /);
    expect(label).not.toMatch(/2026/);
  });

  it("includes the year for a different-year date", () => {
    vi.setSystemTime(new Date("2026-06-09T18:00:00Z"));
    expect(formatMessageSeparator("2024-03-02T09:00:00Z", t, "en")).toMatch(/2024/);
  });
});

describe("formatRelativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number): string => new Date(Date.now() - ms).toISOString();
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it("returns `just now` under a minute", () => {
    expect(formatRelativeTime(ago(30 * SECOND), t, "en")).toBe("just now");
  });

  it("returns minutes, hours, days and weeks", () => {
    expect(formatRelativeTime(ago(5 * MINUTE), t, "en")).toBe("5m");
    expect(formatRelativeTime(ago(3 * HOUR), t, "en")).toBe("3h");
    expect(formatRelativeTime(ago(2 * DAY), t, "en")).toBe("2d");
    expect(formatRelativeTime(ago(2 * 7 * DAY), t, "en")).toBe("2w");
  });

  it("falls back to a date string beyond a month", () => {
    vi.setSystemTime(new Date("2026-06-09T00:00:00Z"));
    expect(formatRelativeTime("2026-01-01T00:00:00Z", t, "en")).not.toMatch(
      /^(just now|\d+[mhdw])$/,
    );
  });
});
