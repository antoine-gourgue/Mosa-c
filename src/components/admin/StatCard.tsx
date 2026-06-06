import type { ReactElement } from "react";

/**
 * Props for the {@link StatCard} component.
 */
export type StatCardProps = {
  label: string;
  value: number;
};

/**
 * A headline metric card for the admin dashboard: a label above a large,
 * locale-formatted count.
 *
 * @param props - The metric label and value.
 * @returns The stat card element.
 */
export function StatCard({ label, value }: StatCardProps): ReactElement {
  return (
    <div className="rounded-2xl border border-line bg-bg p-5">
      <div className="text-sm font-medium text-ink-soft">{label}</div>
      <div className="mt-1 text-3xl font-extrabold text-ink">{value.toLocaleString()}</div>
    </div>
  );
}
