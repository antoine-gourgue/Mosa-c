import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { AdminPinDetail } from "@/components/admin";
import { getAdminPinDetail } from "@/server/services";

/**
 * Metadata for the admin pin detail route.
 */
export const metadata: Metadata = {
  title: "Pin · Admin",
};

/**
 * Admin pin detail page: loads a single pin, or a 404 when the pin does not
 * exist.
 *
 * @param props - Route props.
 * @param props.params - The resolved route params containing the pin id.
 * @returns The pin detail page.
 */
export default async function AdminPinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<ReactElement> {
  const { id } = await params;
  const pin = await getAdminPinDetail(id);
  if (pin === null) {
    notFound();
  }
  return <AdminPinDetail pin={pin} />;
}
