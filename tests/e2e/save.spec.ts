import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("saving a pin shows the toast and adds it to the board", async ({ page }) => {
  await login(page);

  const card = page.locator('a[href="/pin/pin_3"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await card.locator('button:text-is("Save")').click();

  await expect(page.getByText("Saved to Quick Saves")).toBeVisible();

  await page.goto("/boards");
  await expect(page.locator('a[href="/pin/pin_3"]').first()).toBeVisible();

  await page.goto("/");
  const restored = page.locator('a[href="/pin/pin_3"]').first();
  await restored.hover();
  await restored.locator('button:text-is("Saved")').click();
});
