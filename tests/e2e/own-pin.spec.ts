import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a creator's own pin card has no Save action", async ({ page }) => {
  await login(page);
  await page.goto("/create");
  await page.setInputFiles('input[type="file"]', "public/images/creator1.png");
  await expect(page.getByLabel("Selected preview")).toBeVisible();
  const title = `Own pin ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Publish" }).click();
  await page.waitForURL(/\/boards/);

  const card = page.locator("[data-pin-card]", { hasText: title });
  await expect(card).toBeVisible();
  await expect(card.getByRole("button", { name: "Save", exact: true })).toHaveCount(0);
});
