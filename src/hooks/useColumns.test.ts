import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useColumns } from "./useColumns";

/**
 * Sets the mocked viewport width for a test.
 *
 * @param width - The viewport width in pixels.
 */
function setWidth(width: number): void {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
}

describe("useColumns", () => {
  it("computes the column count from the viewport width", () => {
    setWidth(1440);
    const { result } = renderHook(() => useColumns(220, 16, 24));
    expect(result.current).toBe(5);
  });

  it("never returns fewer than two columns", () => {
    setWidth(320);
    const { result } = renderHook(() => useColumns(220, 16, 24));
    expect(result.current).toBe(2);
  });
});
