import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getPinById, isSaved } from "@/server/services";
import { DetailActions } from "./DetailActions";

/**
 * Props for the {@link PinDetail} component.
 */
export type PinDetailProps = {
  pinId: string;
};

/**
 * Pin detail content shared by the overlay and the standalone page: the image
 * on the left and an info panel on the right (actions, breadcrumb, title and
 * description). The creator row and suggestions are added in later tickets.
 *
 * @param props - The id of the pin to display.
 * @returns The pin detail content.
 */
export async function PinDetail({ pinId }: PinDetailProps): Promise<ReactElement> {
  const pin = await getPinById(pinId);
  if (pin === null) {
    notFound();
  }
  const user = await getCurrentUser();
  const saved = user === null ? false : await isSaved(user.id, pin.id);

  return (
    <div className="grid md:grid-cols-2">
      <div className="relative min-h-[420px] bg-surface md:min-h-[560px]">
        <Image
          src={pin.imageUrl}
          alt={pin.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 px-9 py-8">
        <DetailActions
          pinId={pin.id}
          title={pin.title}
          imageUrl={pin.imageUrl}
          link={pin.link}
          initialSaved={saved}
        />
        {pin.category !== null ? (
          <span className="text-sm text-ink-soft">
            mosaic.app / {pin.category.label.toLowerCase()}
          </span>
        ) : null}
        <h1 className="text-[30px] font-extrabold leading-tight text-ink">{pin.title}</h1>
        {pin.description !== null ? (
          <p className="text-base text-[#3a3a3a]">{pin.description}</p>
        ) : null}
      </div>
    </div>
  );
}
