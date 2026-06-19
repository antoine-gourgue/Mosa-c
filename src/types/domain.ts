/**
 * A content creator as surfaced to the UI.
 */
export type Creator = {
  id: string;
  name: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followersLabel: string | null;
  verified: boolean;
  isPrivate: boolean;
};

/**
 * The viewer's follow relationship with a creator: not following, a pending
 * follow request (for private accounts), or following.
 */
export type FollowState = "none" | "requested" | "following";

/**
 * A free-form tag as surfaced to the UI.
 */
export type Tag = {
  id: string;
  slug: string;
  name: string;
};

/**
 * A tag with how many pins carry it, for discovery listings.
 */
export type TagWithCount = Tag & {
  pinCount: number;
};

/**
 * A tag search result: its pin count plus a few preview thumbnails to render in
 * the search "Tags" tab.
 */
export type TagResult = TagWithCount & {
  previewUrls: string[];
};

/**
 * Engagement stats for a single pin in the creator analytics dashboard.
 */
export type PinStat = {
  id: string;
  title: string;
  imageUrl: string;
  views: number;
  saves: number;
  likes: number;
  downloads: number;
};

/**
 * A single day's view count in the analytics trend.
 */
export type AnalyticsDay = {
  day: string;
  views: number;
};

/**
 * A creator's aggregated analytics: totals across all their pins, a per-pin
 * breakdown and a daily views trend.
 */
export type CreatorAnalytics = {
  totals: { views: number; saves: number; likes: number; downloads: number; pins: number };
  pins: PinStat[];
  trend: AnalyticsDay[];
};

/**
 * A pin with its creator and tags, as surfaced to the UI.
 */
/**
 * Publication state of a pin: a private draft, scheduled to go live at a future
 * time, or publicly published.
 */
export type PinStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";

/**
 * Whether a pin's media is a still image or a video. Video pins keep `imageUrl`
 * as the poster, so every image-based surface (feed, cards, boards, OG) renders
 * unchanged, while `videoUrl` adds playback where supported.
 */
export type PinMediaType = "IMAGE" | "VIDEO";

export type Pin = {
  id: string;
  title: string;
  description: string | null;
  altText: string | null;
  imageUrl: string;
  width: number;
  height: number;
  mediaType: PinMediaType;
  videoUrl: string | null;
  videoDurationS: number | null;
  link: string | null;
  place: PinPlace | null;
  status: PinStatus;
  publishAt: Date | null;
  creator: Creator;
  tags: Tag[];
  likeCount: number;
  commentCount: number;
  downloadCount: number;
};

/**
 * An ephemeral story segment: a single image or video that expires 24h after
 * it was posted. `imageUrl` is always the poster, so video and image stories
 * share one rendering path.
 */
export type Story = {
  id: string;
  mediaType: PinMediaType;
  imageUrl: string;
  videoUrl: string | null;
  width: number;
  height: number;
  videoDurationS: number | null;
  createdAt: Date;
  expiresAt: Date;
  likeCount: number;
  viewerCount: number;
  likedByViewer: boolean;
};

/**
 * One author's active stories in the feed reel, with whether the viewer has any
 * unseen segment left (which drives the ring state).
 */
export type StoryReelItem = {
  author: Creator;
  stories: Story[];
  hasUnseen: boolean;
};

/**
 * A viewer of a story in the author's activity list, with whether they liked it.
 */
export type StoryViewerEntry = {
  creator: Creator;
  liked: boolean;
};

/**
 * A profile story highlight: a named, permanently-pinned group of stories shown
 * as a cover on the profile.
 */
export type Highlight = {
  id: string;
  title: string;
  coverUrl: string;
  storyCount: number;
};

/**
 * A highlight with its ordered stories, for playback in the story viewer.
 */
export type HighlightDetail = {
  id: string;
  title: string;
  owner: Creator;
  stories: Story[];
};

/**
 * A geotagged place attached to a pin: a human-readable label, an optional
 * formatted address, and the coordinates used to render it on a map.
 */
export type PinPlace = {
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  approximate: boolean;
};

/**
 * An emoji reaction on a comment, aggregated for display: the emoji, how many
 * users reacted with it, and whether the current viewer is one of them.
 */
export type CommentReaction = {
  emoji: string;
  count: number;
  reactedByViewer: boolean;
};

/**
 * A comment on a pin, as surfaced to the UI.
 */
export type PinComment = {
  id: string;
  body: string;
  createdAt: string;
  author: Creator;
  replies: PinComment[];
  reactions: CommentReaction[];
};

/**
 * A user suggested while typing an @mention in a comment composer.
 */
export type MentionSuggestion = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
};

/**
 * The kind of engagement that produced a notification.
 */
export type NotificationKind = "FOLLOW" | "LIKE" | "COMMENT" | "REPLY" | "REACTION" | "MENTION";

/**
 * A notification as surfaced to the UI, with the actor and target context
 * needed to render and link the item.
 */
export type AppNotification = {
  id: string;
  kind: NotificationKind;
  read: boolean;
  createdAt: string;
  actor: Creator;
  pinId: string | null;
  pinImageUrl: string | null;
  message: string;
};

/**
 * A direct message as surfaced to the UI.
 */
export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
  pin: { id: string; imageUrl: string; title: string } | null;
  imageUrl: string | null;
  system: boolean;
};

/**
 * A conversation summary for the inbox list: the other participant, a preview
 * of the last message, the unread count and the last-activity timestamp.
 */
export type ConversationSummary = {
  id: string;
  /** Primary other participant — the single other in a 1:1, or the first member in a group. */
  other: Creator;
  /** Every participant other than the viewer (one for a 1:1, several for a group). */
  others: Creator[];
  /** Optional group name; null for a 1:1 or an unnamed group. */
  title: string | null;
  isGroup: boolean;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
  updatedAt: string;
};

/**
 * A board with its pin count, as surfaced to the UI.
 */
export type BoardVisibility = "PUBLIC" | "SECRET";

export type Board = {
  id: string;
  name: string;
  description: string | null;
  visibility: BoardVisibility;
  isDefault: boolean;
  pinCount: number;
};

/**
 * A board summary with a cover image and owner handle, for board listings.
 */
export type BoardSummary = Board & {
  coverUrls: string[];
  ownerUsername: string | null;
};

/**
 * A collaborator's role on a board.
 */
export type BoardRole = "OWNER" | "EDITOR" | "VIEWER";

/**
 * A board member as surfaced to the UI: the user and their role.
 */
export type BoardMemberSummary = {
  user: Creator;
  role: BoardRole;
};

/**
 * A board with its owner, members and pins, for the board detail page.
 */
export type BoardDetail = {
  id: string;
  name: string;
  description: string | null;
  visibility: BoardVisibility;
  isDefault: boolean;
  owner: Creator;
  members: BoardMemberSummary[];
  viewerRole: BoardRole | null;
  pins: Pin[];
};
