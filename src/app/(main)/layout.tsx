import type { ReactElement, ReactNode } from "react";
import { ToastProvider } from "@/components/ui";

/**
 * Authenticated application shell wrapping every main route with the toast host,
 * page padding and the parallel modal slot used by the pin detail overlay.
 *
 * @param props - Layout props.
 * @param props.children - The routed page content.
 * @param props.modal - The parallel `@modal` slot (pin detail overlay).
 * @returns The main layout element.
 */
export default function MainLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}): ReactElement {
  return (
    <ToastProvider>
      <main className="px-6 pb-20 pt-4">{children}</main>
      {modal}
    </ToastProvider>
  );
}
