import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import "./globals.css";

/**
 * Static metadata applied to every route in the application.
 */
export const metadata: Metadata = {
  title: {
    default: "Mosaic",
    template: "%s · Mosaic",
  },
  description: "Discover, save and share visual ideas.",
};

/**
 * Viewport configuration for the application.
 */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/**
 * Root layout wrapping every page with the HTML document shell.
 *
 * @param props - Layout props.
 * @param props.children - The route subtree to render inside the document body.
 * @returns The application HTML shell.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
