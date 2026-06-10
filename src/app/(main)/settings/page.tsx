import { redirect } from "next/navigation";

/**
 * The settings index redirects to the Profile tab, the hub's default section.
 */
export default function SettingsPage(): never {
  redirect("/settings/profile");
}
