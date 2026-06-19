"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  addStoryToHighlight,
  createHighlight,
  deleteHighlight,
  getAddableStories,
  getHighlightDetail,
  getHighlights,
  removeStoryFromHighlight,
  renameHighlight,
} from "@/server/services";
import type { Highlight, HighlightDetail, Story } from "@/types/domain";

/**
 * Lists the current user's own highlights (for the "add to highlight" picker).
 *
 * @returns The user's highlights, or an empty list when signed out.
 */
export async function myHighlights(): Promise<Highlight[]> {
  const user = await getCurrentUser();
  if (user === null) {
    return [];
  }
  return getHighlights(user.id);
}

/**
 * Loads a highlight with its stories for playback.
 *
 * @param highlightId - The highlight id.
 * @returns The highlight detail, or null.
 */
export async function loadHighlight(highlightId: string): Promise<HighlightDetail | null> {
  const user = await getCurrentUser();
  return getHighlightDetail(highlightId, user?.id ?? "");
}

/**
 * Lists the current user's active stories that can be added to a highlight.
 *
 * @param highlightId - The target highlight id.
 * @returns The addable stories, or an empty list when signed out.
 */
export async function addableStories(highlightId: string): Promise<Story[]> {
  const user = await getCurrentUser();
  if (user === null) {
    return [];
  }
  return getAddableStories(highlightId, user.id);
}

/**
 * Creates a new highlight seeded with one of the user's stories.
 *
 * @param storyId - The story to seed it with.
 * @param title - The highlight title.
 * @returns The created highlight id, or null.
 */
export async function createStoryHighlight(
  storyId: string,
  title: string,
): Promise<{ ok: boolean; id: string | null }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false, id: null };
  }
  const id = await createHighlight(user.id, title, storyId);
  if (id !== null) {
    revalidatePath("/");
  }
  return { ok: id !== null, id };
}

/**
 * Adds a story to one of the user's existing highlights.
 *
 * @param highlightId - The highlight id.
 * @param storyId - The story to add.
 * @returns Whether the story was added.
 */
export async function addToHighlight(
  highlightId: string,
  storyId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const ok = await addStoryToHighlight(highlightId, storyId, user.id);
  if (ok) {
    revalidatePath("/");
  }
  return { ok };
}

/**
 * Removes a story from a highlight (deletes the highlight when empty).
 *
 * @param highlightId - The highlight id.
 * @param storyId - The story to remove.
 * @returns Whether the change was applied.
 */
export async function removeFromHighlight(
  highlightId: string,
  storyId: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const ok = await removeStoryFromHighlight(highlightId, storyId, user.id);
  if (ok) {
    revalidatePath("/");
  }
  return { ok };
}

/**
 * Renames one of the user's highlights.
 *
 * @param highlightId - The highlight id.
 * @param title - The new title.
 * @returns Whether it was renamed.
 */
export async function renameStoryHighlight(
  highlightId: string,
  title: string,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  return { ok: await renameHighlight(highlightId, user.id, title) };
}

/**
 * Deletes one of the user's highlights (keeps the underlying stories).
 *
 * @param highlightId - The highlight id.
 * @returns Whether it was deleted.
 */
export async function removeHighlight(highlightId: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (user === null) {
    return { ok: false };
  }
  const ok = await deleteHighlight(highlightId, user.id);
  if (ok) {
    revalidatePath("/");
  }
  return { ok };
}
