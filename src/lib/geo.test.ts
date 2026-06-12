import { describe, expect, it } from "vitest";
import { haversineKm } from "./geo";

describe("haversineKm", () => {
  it("is zero for identical points", () => {
    expect(haversineKm(48.85, 2.35, 48.85, 2.35)).toBe(0);
  });

  it("measures a known distance (Paris to London ~344 km)", () => {
    const km = haversineKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(km).toBeGreaterThan(330);
    expect(km).toBeLessThan(350);
  });

  it("is symmetric", () => {
    const ab = haversineKm(40.7128, -74.006, 34.0522, -118.2437);
    const ba = haversineKm(34.0522, -118.2437, 40.7128, -74.006);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it("keeps a short hop small (~1.5 km across central Paris)", () => {
    const km = haversineKm(48.8606, 2.3376, 48.8529, 2.3499);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(2.5);
  });
});
