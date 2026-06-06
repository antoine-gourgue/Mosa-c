import { Suspense } from "react";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { Fab, TopNav } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorById } from "@/server/services";

/**
 * Authenticated application shell wrapping every main route with the sticky top
 * navigation, the toast host, page padding and the parallel modal slot used by
 * the pin detail overlay.
 *
 * @param props - Layout props.
 * @param props.children - The routed page content.
 * @param props.modal - The parallel `@modal` slot (pin detail overlay).
 * @returns The main layout element.
 */
export default async function MainLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}): Promise<ReactElement> {
  const user = await getCurrentUser();
  const profile = user === null ? null : await getCreatorById(user.id);
  return (
    <ToastProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:font-semibold focus:text-bg"
      >
        Skip to content
      </a>
      <Suspense>
        <TopNav
          user={{
            name: user?.name ?? "You",
            image: user?.image ?? null,
            username: profile?.username ?? null,
          }}
        />
      </Suspense>
      <main id="main-content" tabIndex={-1} className="px-6 pb-20 pt-4">
        {children}
      </main>
      <Fab />
      {modal}
    </ToastProvider>
  );
}
