import type { ReactElement } from "react";
import { PinDetail } from "@/components/detail";

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
    <div className="mx-auto max-w-[1016px] overflow-hidden rounded-[32px] bg-bg shadow-pop">
      <PinDetail pinId={id} />
    </div>
  );
}
