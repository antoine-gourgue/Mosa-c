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
export type Pin = {
  id: string;
  title: string;
  description: string | null;
  altText: string | null;
  imageUrl: string;
  width: number;
  height: number;
  link: string | null;
  creator: Creator;
  tags: Tag[];
  likeCount: number;
  commentCount: number;
  downloadCount: number;
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
