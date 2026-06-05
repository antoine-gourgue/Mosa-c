import type { Metadata } from "next";
import type { ReactElement } from "react";
import { CreatePin } from "@/components/create";

/**
 * Metadata for the create route.
 */
export const metadata: Metadata = {
  title: "Create Pin",
};

/**
 * Create Pin route.
 *
 * @returns The create page.
 */
export default function CreatePage(): ReactElement {
  return <CreatePin />;
}
