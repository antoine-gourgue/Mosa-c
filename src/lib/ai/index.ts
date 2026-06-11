import { env } from "@/lib/env";
import { createMistralProvider } from "./mistral";
import type { AiProvider, TagSuggestionInput } from "./types";

/**
 * The app-wide AI provider, configured from the environment. Server-only — it
 * reads a secret API key and must never be imported into client code. Swapping
 * providers is a one-line change here.
 */
const provider: AiProvider = createMistralProvider({ apiKey: env.MISTRAL_API_KEY });

/**
 * Whether AI features are configured. Use this to gate optional UI/behaviour.
 *
 * @returns True when an AI provider is available.
 */
export function aiAvailable(): boolean {
  return provider.available();
}

/**
 * Describes an image in a short sentence, or null when AI is unavailable or the
 * request fails.
 *
 * @param imageUrl - The image to describe.
 * @returns The description, or null.
 */
export function describeImage(imageUrl: string): Promise<string | null> {
  return provider.describeImage(imageUrl);
}

/**
 * Suggests lowercase topic tags for a pin from its image and/or text. Returns an
 * empty list when AI is unavailable or the request fails.
 *
 * @param input - The pin's image and text context.
 * @returns The suggested tags.
 */
export function suggestTags(input: TagSuggestionInput): Promise<string[]> {
  return provider.suggestTags(input);
}

/**
 * Returns an embedding vector for a piece of text, or null when AI is
 * unavailable or the request fails.
 *
 * @param text - The text to embed.
 * @returns The embedding, or null.
 */
export function embed(text: string): Promise<number[] | null> {
  return provider.embed(text);
}

export type { AiProvider, TagSuggestionInput } from "./types";
