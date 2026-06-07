import Link from "next/link";
import type { ReactElement } from "react";
import { PinFeed } from "@/components/pin";
import { getHomeFeed } from "@/server/services";

/**
 * Public landing shown to signed-out visitors on the home route: a hero with
 * sign-up / log-in calls to action over a read-only preview of trending pins.
 * Pins link through to their public detail; save prompts sign-in.
 *
 * @returns The landing element.
 */
export async function Landing(): Promise<ReactElement> {
  const page = await getHomeFeed({ feed: "foryou", sort: "recent", viewerId: null });
  const pins = page.pins.slice(0, 18);

  return (
    <div>
      <section className="py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight text-ink sm:text-6xl">
          Discover and save visual ideas
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
          A home for the things you love. Browse pins, build boards and follow the creators who
          inspire you.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="h-12 rounded-full bg-accent px-7 text-[15px] font-semibold leading-[48px] text-bg transition-colors hover:bg-accent-press"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="h-12 rounded-full bg-surface px-7 text-[15px] font-semibold leading-[48px] text-ink transition-colors hover:bg-surface-2"
          >
            Log in
          </Link>
        </div>
      </section>

      {pins.length > 0 ? (
        <section>
          <h2 className="mb-4 text-lg font-bold text-ink">Trending ideas</h2>
          <PinFeed pins={pins} savedIds={[]} viewerId={null} />
        </section>
      ) : null}
    </div>
  );
}
