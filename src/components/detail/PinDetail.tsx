import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { Divider } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getComments, getLikeState, getPinById, isFollowing, isSaved } from "@/server/services";
import { DetailActions } from "./DetailActions";
import { CreatorRow } from "./CreatorRow";
import { MoreLikeCreator } from "./MoreLikeCreator";
import { Comments } from "./Comments";

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
  const [saved, following, like, comments] = await Promise.all([
    user === null ? Promise.resolve(false) : isSaved(user.id, pin.id),
    user === null ? Promise.resolve(false) : isFollowing(user.id, pin.creator.id),
    getLikeState(pin.id, user?.id ?? null),
    getComments(pin.id),
  ]);

  return (
    <div className="grid md:grid-cols-2">
      <div className="flex items-center justify-center bg-surface">
        <Image
          src={pin.imageUrl}
          alt={pin.title}
          width={pin.width}
          height={pin.height}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-auto max-h-[85vh] w-full object-contain"
        />
      </div>
      <div className="flex flex-col gap-4 px-9 py-8">
        <DetailActions
          pinId={pin.id}
          title={pin.title}
          imageUrl={pin.imageUrl}
          link={pin.link}
          initialSaved={saved}
          initialLiked={like.liked}
          likeCount={like.count}
          downloadCount={pin.downloadCount}
          isOwner={user?.id === pin.creator.id}
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
        <Divider className="my-2" />
        <CreatorRow creator={pin.creator} initialFollowing={following} />
        <MoreLikeCreator creatorName={pin.creator.name} excludeId={pin.creator.id} />
        <Divider className="my-2" />
        <Comments
          pinId={pin.id}
          initialComments={comments}
          viewerId={user?.id ?? null}
          isPinOwner={user?.id === pin.creator.id}
        />
      </div>
    </div>
  );
}
