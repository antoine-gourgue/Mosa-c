import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("opening a pin shows the detail overlay and closing returns to the feed", async ({ page }) => {
  await login(page);
  await page.locator('a[href^="/pin/"]').first().click();
  await expect(page).toHaveURL(/\/pin\//);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
