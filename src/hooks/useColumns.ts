"use client";

import { useEffect, useState } from "react";

const MAX_WIDTH = 1600;

/**
 * Computes the number of masonry columns for the current viewport width,
 * recomputing on resize and never returning fewer than two columns.
 *
 * @param min - Minimum column width in pixels.
 * @param gap - Horizontal gap between columns in pixels.
 * @param pad - Horizontal page padding (one side) in pixels.
 * @returns The number of columns to render.
 */
export function useColumns(min = 220, gap = 16, pad = 24): number {
  const [columns, setColumns] = useState(5);

  useEffect(() => {
    const calc = (): void => {
      const width = Math.min(window.innerWidth, MAX_WIDTH) - pad * 2;
      setColumns(Math.max(2, Math.floor((width + gap) / (min + gap))));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => {
      window.removeEventListener("resize", calc);
    };
  }, [min, gap, pad]);

  return columns;
}
