import { Suspense } from "react";
import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { TopNav } from "@/components/layout";
import { getCurrentUser } from "@/lib/auth";

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
  return (
    <ToastProvider>
      <Suspense>
        <TopNav user={{ name: user?.name ?? "You", image: user?.image ?? null }} />
      </Suspense>
      <main className="px-6 pb-20 pt-4">{children}</main>
      {modal}
    </ToastProvider>
  );
}
