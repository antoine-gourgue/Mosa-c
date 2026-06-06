import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/**
 * Signs in with the seeded admin account.
 *
 * @param page - The Playwright page.
 */
async function loginAsAdmin(page: import("@playwright/test").Page): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@mosaic.app");
  await page.fill('input[type="password"]', "password123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}

test("signed-out visitors are sent to login from /admin", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL(/\/login/);
});

test("non-admins are redirected away from /admin", async ({ page }) => {
  await login(page);
  await page.goto("/admin");
  await page.waitForURL("/");
});

test("admins can open the dashboard and navigate the back office", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Pins", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Categories" }).click();
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
});

test("admins can list and search users", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  await expect(page.getByText("admin@mosaic.app")).toBeVisible();
  await page.getByLabel("Search users").fill("northlight");
  await expect(page.getByText("north@mosaic.app")).toBeVisible();
  await expect(page.getByText("admin@mosaic.app")).toHaveCount(0);
});
