import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("the owner sees their liked pins under the Liked tab", async ({ page }) => {
  await login(page);
  await page.goto("/");

  const card = page.locator("[data-pin-card]").first();
  const href = await card.locator("a[href^='/pin/']").first().getAttribute("href");
  await card.hover();

  const toggle = card.getByRole("button", { name: /^(Like|Unlike)$/ });
  if ((await toggle.getAttribute("aria-label")) === "Like") {
    await toggle.click();
    await expect(card.getByRole("button", { name: "Unlike", exact: true })).toBeVisible();
  }

  await page.goto("/u/you?tab=liked");
  await expect(page.getByRole("link", { name: "Liked" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(`[data-pin-card] a[href="${href}"]`)).toBeVisible();

  // unlike from the liked tab to leave the shared dev DB as we found it
  const likedCard = page.locator(`[data-pin-card]:has(a[href="${href}"])`);
  await likedCard.hover();
  await likedCard.getByRole("button", { name: "Unlike", exact: true }).click();
  await expect(likedCard.getByRole("button", { name: "Like", exact: true })).toBeVisible();
});
