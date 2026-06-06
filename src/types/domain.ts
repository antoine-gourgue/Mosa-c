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
};

/**
 * A pin category as surfaced to the UI.
 */
export type Category = {
  id: string;
  slug: string;
  label: string;
  imageUrl: string;
};

/**
 * A pin with its creator and optional category, as surfaced to the UI.
 */
export type Pin = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  width: number;
  height: number;
  link: string | null;
  creator: Creator;
  category: Category | null;
};

/**
 * A comment on a pin, as surfaced to the UI.
 */
export type PinComment = {
  id: string;
  body: string;
  createdAt: string;
  author: Creator;
};

/**
 * A board with its pin count, as surfaced to the UI.
 */
export type Board = {
  id: string;
  name: string;
  isDefault: boolean;
  pinCount: number;
};

/**
 * A board summary with a cover image and owner handle, for board listings.
 */
export type BoardSummary = Board & {
  coverUrl: string | null;
  ownerUsername: string | null;
};

/**
 * A board with its owner and pins, for the board detail page.
 */
export type BoardDetail = {
  id: string;
  name: string;
  isDefault: boolean;
  owner: Creator;
  pins: Pin[];
};
