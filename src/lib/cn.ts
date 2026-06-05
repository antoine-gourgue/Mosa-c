/**
 * Joins truthy class-name values into a single space-separated string.
 *
 * @param values - Class names or falsy values to skip.
 * @returns The merged class string.
 */
export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
