import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import Script from "next/script";
import type { ReactElement, ReactNode } from "react";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { JsonLd } from "@/components/seo";
import { env } from "@/lib/env";
import { SITE } from "@/lib/site";
import "./globals.css";

/**
 * Base URL used for structured data.
 */
const BASE_URL = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/brand/apple-touch-icon.png",
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
export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>): Promise<ReactElement> {
  const umamiEnabled = env.UMAMI_SRC !== undefined && env.UMAMI_WEBSITE_ID !== undefined;
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: BASE_URL,
            description: SITE.description,
          }}
        />
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <RegisterServiceWorker />
      </body>
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
