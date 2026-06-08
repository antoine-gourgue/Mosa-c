import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { JsonLd } from "@/components/seo";
import { Divider } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth";
import {
  getBoardsForUser,
  getComments,
  getFollowCounts,
  getLikeState,
  getPinById,
  isFollowing,
} from "@/server/services";
import { DetailActions } from "./DetailActions";
import { CreatorRow } from "./CreatorRow";
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
  const [following, like, comments, boards, followCounts] = await Promise.all([
    user === null ? Promise.resolve(false) : isFollowing(user.id, pin.creator.id),
    getLikeState(pin.id, user?.id ?? null),
    getComments(pin.id, user?.id ?? null),
    user === null ? Promise.resolve([]) : getBoardsForUser(user.id),
    getFollowCounts(pin.creator.id),
  ]);

  const aspectClass =
    pin.height > pin.width
      ? "aspect-[3/4]"
      : pin.width > pin.height
        ? "aspect-[4/3]"
        : "aspect-square";

  return (
    <div className="flex flex-col md:relative md:block">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ImageObject",
          name: pin.title,
          description: pin.description ?? `A pin by ${pin.creator.name} on Mosaic.`,
          contentUrl: pin.imageUrl,
          width: pin.width,
          height: pin.height,
          author: { "@type": "Person", name: pin.creator.name },
        }}
      />
      <div className="shrink-0 p-3 md:flex md:min-h-[520px] md:w-1/2 md:items-center md:justify-center md:p-4">
        <div className={cn("relative w-full overflow-hidden rounded-2xl bg-surface", aspectClass)}>
          <Image
            src={pin.imageUrl}
            alt={pin.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col md:absolute md:inset-y-0 md:right-0 md:w-1/2 md:overflow-hidden">
        <div className="shrink-0 px-5 pt-2 md:px-8 md:pt-6">
          <DetailActions
            pinId={pin.id}
            title={pin.title}
            imageUrl={pin.imageUrl}
            link={pin.link}
            initialLiked={like.liked}
            likeCount={like.count}
            downloadCount={pin.downloadCount}
            isOwner={user?.id === pin.creator.id}
            boards={boards.map((board) => ({
              id: board.id,
              name: board.name,
              isDefault: board.isDefault,
            }))}
            isAuthed={user !== null}
          />
        </div>
        <Comments
          pinId={pin.id}
          initialComments={comments}
          viewerId={user?.id ?? null}
          isPinOwner={user?.id === pin.creator.id}
          header={
            <div className="flex flex-col gap-2">
              {pin.category !== null ? (
                <span className="text-sm font-medium text-ink-soft">
                  mosaic.app / {pin.category.label.toLowerCase()}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold leading-tight text-ink md:text-[28px]">
                {pin.title}
              </h1>
              {pin.description !== null ? (
                <p className="text-[15px] leading-relaxed text-ink-soft">{pin.description}</p>
              ) : null}
              <Divider className="mt-2" />
              <CreatorRow
                creator={pin.creator}
                initialFollowing={following}
                isSelf={user?.id === pin.creator.id}
                followers={followCounts.followers}
                isAuthed={user !== null}
              />
            </div>
          }
        />
      </div>
    </div>
  );
}
