import Link from "next/link";
import type { ReactElement } from "react";
import { PinDetail } from "@/components/detail";
import { BackIcon } from "@/icons";

/**
 * Standalone pin detail page used for deep links and refreshes.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the pin id.
 * @returns The pin detail page.
 */
export default async function PinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-[1016px]">
      <Link
        href="/"
        aria-label="Back to feed"
        className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-bg text-ink shadow-pop transition-colors hover:bg-surface"
      >
        <BackIcon />
      </Link>
      <div className="overflow-hidden rounded-[32px] bg-bg shadow-pop">
        <PinDetail pinId={id} />
      </div>
    </div>
  );
}
