import { expect, test } from "@playwright/test";

test("signed-out visitors see a public landing on the home route", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Discover and save visual ideas" })).toBeVisible();
});

test("signed-out visitors can read a pin", async ({ page }) => {
  await page.goto("/pin/pin_1");
  await expect(page).toHaveURL(/\/pin\/pin_1/);
  await expect(page.getByRole("heading", { name: "Lago di Braies, Dolomites" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in", exact: true })).toBeVisible();
});

test("signed-out visitors can read a profile", async ({ page }) => {
  await page.goto("/u/north");
  await expect(page).toHaveURL(/\/u\/north/);
  await expect(page.getByRole("heading", { name: "Northlight" })).toBeVisible();
});

test("a write action sends signed-out visitors to login", async ({ page }) => {
  await page.goto("/pin/pin_1");
  await page.getByRole("button", { name: "Follow" }).first().click();
  await page.waitForURL(/\/login/);
});

test("protected routes still require authentication", async ({ page }) => {
  await page.goto("/create");
  await page.waitForURL(/\/login/);
});
