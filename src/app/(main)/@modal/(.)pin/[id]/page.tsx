import type { ReactElement } from "react";
import { DetailModal, PinDetail } from "@/components/detail";

/**
 * Intercepting route that opens the pin detail as an overlay when navigating
 * from within the app, while the standalone page handles deep links.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the pin id.
 * @returns The pin detail overlay.
 */
export default async function PinModal({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  return (
    <DetailModal>
      <PinDetail pinId={id} />
    </DetailModal>
  );
}
