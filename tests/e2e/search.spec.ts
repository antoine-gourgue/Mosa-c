import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("searching filters pins and shows an empty state", async ({ page }) => {
  await login(page);
  await page.goto("/search?q=galaxy");
  await expect(page.getByText("Galaxy wallpaper")).toBeVisible();

  await page.goto("/search?q=zzqqxx-no-match");
  await expect(page.getByText(/No ideas matched/i)).toBeVisible();
});

test("the discovery view shows categories with no query", async ({ page }) => {
  await login(page);
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Ideas for you" })).toBeVisible();
});
