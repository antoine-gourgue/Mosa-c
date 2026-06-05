import type { ComponentPropsWithRef, ReactElement } from "react";
import { cn } from "@/lib/cn";

/**
 * Props for the {@link Divider} component.
 */
export type DividerProps = ComponentPropsWithRef<"hr">;

/**
 * Thin horizontal rule using the `line` token, used to separate sections.
 *
 * @param props - Native hr attributes.
 * @returns The rendered divider element.
 */
export function Divider({ className, ...rest }: DividerProps): ReactElement {
  return <hr className={cn("border-0 border-t border-line", className)} {...rest} />;
}
