import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A column definition for {@link DataTable}.
 */
export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

/**
 * Props for the {@link DataTable} component.
 */
export type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  empty?: string;
};

/**
 * A reusable, strongly typed table for admin lists. Renders a header row from
 * the column definitions and one row per item, or an empty-state message when
 * there is no data.
 *
 * @param props - The columns, rows, a row-key accessor and an empty message.
 * @returns The data table element.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty = "Nothing to show yet.",
}: DataTableProps<T>): ReactElement {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-bg p-6 text-sm text-ink-soft">{empty}</div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-bg">
      <table className="w-full text-left text-[14px]">
        <thead>
          <tr className="border-b border-line text-ink-soft">
            {columns.map((column) => (
              <th key={column.key} className={cn("px-4 py-3 font-semibold", column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="border-b border-line last:border-0">
              {columns.map((column) => (
                <td key={column.key} className={cn("px-4 py-3 text-ink", column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
