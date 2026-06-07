import { describe, expect, it } from "vitest";
import { formatLastActive, shouldSeparateMessages } from "./time";

describe("formatLastActive", () => {
  const minutesAgo = (n: number): string => new Date(Date.now() - n * 60000).toISOString();

  it("returns null without a timestamp", () => {
    expect(formatLastActive(null)).toBeNull();
  });

  it("formats minutes up to 59", () => {
    expect(formatLastActive(minutesAgo(5))).toBe("active 5m ago");
    expect(formatLastActive(minutesAgo(59))).toBe("active 59m ago");
  });

  it("formats hours up to 12", () => {
    expect(formatLastActive(minutesAgo(90))).toBe("active 1h ago");
    expect(formatLastActive(minutesAgo(12 * 60))).toBe("active 12h ago");
  });

  it("returns null beyond 12 hours", () => {
    expect(formatLastActive(minutesAgo(13 * 60))).toBeNull();
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
