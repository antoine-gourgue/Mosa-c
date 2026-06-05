"use client";

import type { CSSProperties, ReactElement, ReactNode } from "react";
import { useColumns } from "@/hooks";

/**
 * Props for the {@link Masonry} component.
 */
export type MasonryProps = {
  children: ReactNode;
  min?: number;
};

const COLUMN_GAP = 16;

/**
 * Responsive masonry layout using CSS columns. The column count adapts to the
 * viewport through {@link useColumns}; each child should avoid breaking across
 * columns (e.g. `break-inside-avoid`). Used by the feed, search and board.
 *
 * @param props - The cards to lay out and the minimum column width.
 * @returns The masonry container element.
 */
export function Masonry({ children, min = 220 }: MasonryProps): ReactElement {
  const columns = useColumns(min);
  const style: CSSProperties = { columnCount: columns, columnGap: COLUMN_GAP };
  return <div style={style}>{children}</div>;
}
