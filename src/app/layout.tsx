import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactElement, ReactNode } from "react";
import { env } from "@/lib/env";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * Static metadata applied to every route in the application.
 */
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
};

/**
 * Viewport configuration for the application.
 */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

/**
 * Root layout wrapping every page with the HTML document shell. The Umami
 * analytics script is injected only when both its source and website id are
 * configured.
 *
 * @param props - Layout props.
 * @param props.children - The route subtree to render inside the document body.
 * @returns The application HTML shell.
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): ReactElement {
  const umamiEnabled = env.UMAMI_SRC !== undefined && env.UMAMI_WEBSITE_ID !== undefined;
  return (
    <html lang="en">
      <body>{children}</body>
      {umamiEnabled ? (
        <Script
          src={env.UMAMI_SRC}
          data-website-id={env.UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      ) : null}
    </html>
  );
}
