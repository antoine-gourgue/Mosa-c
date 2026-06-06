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

test("admins can moderate pins and comments", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/moderation");
  await expect(page.getByRole("heading", { name: "Moderation" })).toBeVisible();
  await page.getByLabel("Search pins").fill("Paris");
  await expect(page.getByText("Paris at dusk")).toBeVisible();
  await page.getByRole("link", { name: "comments" }).click();
  await expect(page.getByText(/Stunning shot/)).toBeVisible();
});

test("admins can triage the reports queue", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByText("Above the green valley")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss" }).first().click();
  await expect(page.getByText("Report dismissed")).toBeVisible();
});

test("admins can open a user's detail and edit it", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/users");
  await page.getByRole("link", { name: "Northlight" }).click();
  await expect(page.getByRole("heading", { name: "Northlight" })).toBeVisible();
  await page.getByLabel("Name").fill("Northlight Studio");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Profile updated")).toBeVisible();
});

test("admins can open a pin's detail and edit it", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/moderation?q=Paris");
  await page.getByRole("link", { name: "Paris at dusk" }).click();
  await expect(page.getByRole("heading", { name: "Edit pin" })).toBeVisible();
  await page.getByLabel("Title").fill("Paris, blue hour");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Pin updated")).toBeVisible();
});

test("admins can create a category", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/categories");
  await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
  await page.getByRole("button", { name: "Add category" }).click();
  const name = `Street Food ${Date.now()}`;
  await page.getByLabel("Name").fill(name);
  await page
    .getByLabel("Cover image URL")
    .fill("https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200");
  await page.getByRole("button", { name: "Create" }).click();
  await expect(page.getByText(name)).toBeVisible();
});
