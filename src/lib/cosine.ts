/**
 * Cosine similarity between two equal-length vectors, in [-1, 1] (1 = identical
 * direction). Returns 0 for mismatched/empty inputs or a zero vector, so callers
 * can treat it as "no similarity".
 *
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The cosine similarity, or 0 when undefined.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
