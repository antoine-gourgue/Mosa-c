/**
 * A content creator as surfaced to the UI.
 */
export type Creator = {
  id: string;
  name: string;
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
 * A board with its pin count, as surfaced to the UI.
 */
export type Board = {
  id: string;
  name: string;
  isDefault: boolean;
  pinCount: number;
};
