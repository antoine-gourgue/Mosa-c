import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { ReactElement } from "react";
import type { CreatorAnalytics } from "@/types/domain";

/**
 * Props for the {@link AnalyticsDashboard} component.
 */
export type AnalyticsDashboardProps = {
  analytics: CreatorAnalytics;
};

/**
 * A labelled total stat card.
 *
 * @param props - The label and value.
 * @returns The stat card element.
 */
function StatCard({ label, value }: { label: string; value: number }): ReactElement {
  return (
    <div className="rounded-2xl bg-surface px-4 py-4">
      <p className="text-2xl font-extrabold text-ink">{value.toLocaleString()}</p>
      <p className="mt-0.5 text-sm text-ink-soft">{label}</p>
    </div>
  );
}

/**
 * Creator analytics dashboard: total views/saves/likes/downloads, a 30-day views
 * trend rendered as lightweight bars, and a per-pin engagement table (best pins
 * first). Shows an empty state when the creator has no pins yet.
 *
 * @param props - The aggregated creator analytics.
 * @returns The dashboard element.
 */
export async function AnalyticsDashboard({
  analytics,
}: AnalyticsDashboardProps): Promise<ReactElement> {
  const t = await getTranslations("analytics");
  const { totals, pins, trend } = analytics;
  const peak = Math.max(1, ...trend.map((day) => day.views));

  if (totals.pins === 0) {
    return <p className="py-16 text-center text-ink-soft">{t("empty")}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("views")} value={totals.views} />
        <StatCard label={t("saves")} value={totals.saves} />
        <StatCard label={t("likes")} value={totals.likes} />
        <StatCard label={t("downloads")} value={totals.downloads} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">{t("viewsTrend")}</h2>
        <div className="flex h-32 items-end gap-1 rounded-2xl bg-surface p-4">
          {trend.map((day) => (
            <div
              key={day.day}
              className="flex-1 rounded-sm bg-accent/70"
              style={{ height: `${Math.round((day.views / peak) * 100)}%` }}
              title={`${day.day}: ${day.views}`}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-ink">{t("perPin")}</h2>
        <div className="overflow-hidden rounded-2xl bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-4 py-3 font-medium">{t("pin")}</th>
                <th className="px-3 py-3 text-right font-medium">{t("views")}</th>
                <th className="px-3 py-3 text-right font-medium">{t("saves")}</th>
                <th className="px-3 py-3 text-right font-medium">{t("likes")}</th>
                <th className="px-4 py-3 text-right font-medium">{t("downloads")}</th>
              </tr>
            </thead>
            <tbody>
              {pins.map((pin) => (
                <tr key={pin.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2.5">
                    <Link href={`/pin/${pin.id}`} className="flex items-center gap-3">
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                        <Image
                          src={pin.imageUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </span>
                      <span className="line-clamp-1 font-medium text-ink">{pin.title}</span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink">
                    {pin.views.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                    {pin.saves.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                    {pin.likes.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                    {pin.downloads.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
