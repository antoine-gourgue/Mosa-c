import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("unauthenticated users are redirected to login from protected routes", async ({ page }) => {
  await page.goto("/create");
  await expect(page).toHaveURL(/\/login/);
});

test("a user can sign in and reach the feed", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("link", { name: "Mosaic" })).toBeVisible();
  await expect(page.locator("[data-pin-card]").first()).toBeVisible();
});
