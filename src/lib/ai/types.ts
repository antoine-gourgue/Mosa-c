/**
 * Context for suggesting tags for a pin. Any field may be absent; at least the
 * image or some text should be provided for a useful result.
 */
export type TagSuggestionInput = {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
};

/**
 * The provider-agnostic AI interface the app depends on. A concrete provider
 * (currently Mistral) implements it, so the backend can be swapped without
 * touching callers. Every method degrades gracefully — returning null or an
 * empty list — when AI is unconfigured or the request fails, so an AI outage
 * never blocks a user flow.
 */
export type AiProvider = {
  /**
   * Whether the provider is configured (an API key is present).
   */
  available(): boolean;
  /**
   * Describes an image in a short sentence, or null when unavailable.
   */
  describeImage(imageUrl: string): Promise<string | null>;
  /**
   * Suggests a handful of lowercase topic tags from a pin's image and/or text.
   * Returns an empty list when unavailable.
   */
  suggestTags(input: TagSuggestionInput): Promise<string[]>;
  /**
   * Returns an embedding vector for a piece of text, or null when unavailable.
   */
  embed(text: string): Promise<number[] | null>;
};
