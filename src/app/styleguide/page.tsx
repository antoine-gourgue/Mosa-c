import type { Metadata } from "next";
import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { Styleguide } from "./Styleguide";

/**
 * Metadata for the styleguide route.
 */
export const metadata: Metadata = {
  title: "Styleguide",
};

/**
 * Development-only route rendering every design-system component and its
 * variants. Returns a 404 in production builds.
 *
 * @returns The styleguide page, or triggers a not-found response in production.
 */
export default function StyleguidePage(): ReactElement {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <Styleguide />;
}
