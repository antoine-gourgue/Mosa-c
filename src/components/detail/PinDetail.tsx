import Image from "next/image";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { JsonLd } from "@/components/seo";
import { Divider, Tag } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth";
import {
  getBoardsForUser,
  getComments,
  getFollowCounts,
  getFollowState,
  getLikeState,
  getPinById,
} from "@/server/services";
import type { FollowState } from "@/types/domain";
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
  const [followState, like, comments, boards, followCounts] = await Promise.all([
    user === null ? Promise.resolve<FollowState>("none") : getFollowState(user.id, pin.creator.id),
    getLikeState(pin.id, user?.id ?? null),
    getComments(pin.id, user?.id ?? null),
    user === null ? Promise.resolve([]) : getBoardsForUser(user.id),
    getFollowCounts(pin.creator.id),
  ]);

  const isOwner = user?.id === pin.creator.id;
  if (pin.creator.isPrivate && !isOwner && followState !== "following") {
    notFound();
  }

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
            description={pin.description}
            tags={pin.tags.map((tag) => tag.name)}
            imageUrl={pin.imageUrl}
            link={pin.link}
            initialLiked={like.liked}
            likeCount={like.count}
            downloadCount={pin.downloadCount}
            isOwner={isOwner}
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
          isPinOwner={isOwner}
          header={
            <div className="flex flex-col gap-2">
              {pin.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {pin.tags.map((tag) => (
                    <Tag key={tag.id} href={`/tag/${tag.slug}`}>
                      #{tag.name}
                    </Tag>
                  ))}
                </div>
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
                initialState={followState}
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
