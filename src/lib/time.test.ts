import { describe, expect, it } from "vitest";
import { shouldSeparateMessages } from "./time";

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
