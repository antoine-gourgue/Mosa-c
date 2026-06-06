import type { Metadata } from "next";
import type { ReactElement } from "react";
import { AdminPlaceholder } from "@/components/admin";

/**
 * Metadata for the admin moderation route.
 */
export const metadata: Metadata = {
  title: "Moderation · Admin",
};

/**
 * Admin moderation section (placeholder until the moderation ticket).
 *
 * @returns The moderation page.
 */
export default function AdminModerationPage(): ReactElement {
  return <AdminPlaceholder title="Moderation" />;
}
