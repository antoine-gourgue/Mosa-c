import type { Page } from "@playwright/test";

export const DEMO_EMAIL = "demo@mosaic.app";
export const DEMO_PASSWORD = "password123";

/**
 * Signs in with the seeded demo account and waits for the home feed.
 *
 * @param page - The Playwright page.
 */
export async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
}
