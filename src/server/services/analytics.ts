import { prisma } from "@/lib/prisma";
import type { AnalyticsDay, CreatorAnalytics, PinStat } from "@/types/domain";

/**
 * Number of days covered by the views trend.
 */
const TREND_DAYS = 30;

/**
 * Returns the UTC midnight of a date — the per-day bucket views are stored and
 * grouped by.
 *
 * @param date - The reference date.
 * @returns A date at 00:00:00 UTC of the same day.
 */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Builds a continuous {@link TREND_DAYS}-day series ending today, filling days
 * with no views with zero so the chart has no gaps.
 *
 * @param start - The first day (UTC midnight) of the window.
 * @param counts - View counts keyed by `YYYY-MM-DD`.
 * @returns The ordered daily series.
 */
function buildTrend(start: Date, counts: Map<string, number>): AnalyticsDay[] {
  const trend: AnalyticsDay[] = [];
  for (let offset = 0; offset < TREND_DAYS; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    const key = day.toISOString().slice(0, 10);
    trend.push({ day: key, views: counts.get(key) ?? 0 });
  }
  return trend;
}

/**
 * Aggregates a creator's pin engagement for their analytics dashboard: per-pin
 * views, saves, likes and downloads (best pins first), the totals across every
 * pin, and a daily views trend over the last {@link TREND_DAYS} days.
 *
 * @param creatorId - The creator whose pins to aggregate.
 * @returns The creator's analytics.
 */
export async function getCreatorAnalytics(creatorId: string): Promise<CreatorAnalytics> {
  const pins = await prisma.pin.findMany({
    where: { creatorId },
    select: {
      id: true,
      title: true,
      imageUrl: true,
      downloadCount: true,
      _count: { select: { saves: true, likes: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const pinIds = pins.map((pin) => pin.id);

  const since = startOfUtcDay(new Date());
  since.setUTCDate(since.getUTCDate() - (TREND_DAYS - 1));

  const [viewsByPin, viewsByDay] = await Promise.all([
    prisma.pinView.groupBy({
      by: ["pinId"],
      where: { pinId: { in: pinIds } },
      _count: { _all: true },
    }),
    prisma.pinView.groupBy({
      by: ["viewedOn"],
      where: { pinId: { in: pinIds }, viewedOn: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const viewMap = new Map(viewsByPin.map((row) => [row.pinId, row._count._all]));
  const stats: PinStat[] = pins
    .map((pin) => ({
      id: pin.id,
      title: pin.title,
      imageUrl: pin.imageUrl,
      views: viewMap.get(pin.id) ?? 0,
      saves: pin._count.saves,
      likes: pin._count.likes,
      downloads: pin.downloadCount,
    }))
    .sort((a, b) => b.views - a.views || b.saves - a.saves);

  const totals = stats.reduce(
    (acc, stat) => ({
      views: acc.views + stat.views,
      saves: acc.saves + stat.saves,
      likes: acc.likes + stat.likes,
      downloads: acc.downloads + stat.downloads,
      pins: acc.pins,
    }),
    { views: 0, saves: 0, likes: 0, downloads: 0, pins: pins.length },
  );

  const dayCounts = new Map(
    viewsByDay.map((row) => [row.viewedOn.toISOString().slice(0, 10), row._count._all]),
  );
  return { totals, pins: stats, trend: buildTrend(since, dayCounts) };
}
