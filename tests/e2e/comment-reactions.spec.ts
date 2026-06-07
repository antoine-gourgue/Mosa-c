import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can react to a comment with an emoji", async ({ page }) => {
  await login(page);
  await page.goto("/pin/pin_1");
  await expect(page.getByText(/Stunning shot/)).toBeVisible();

  await page.getByRole("button", { name: "Add a reaction" }).first().click();
  const search = page.getByLabel("Type to search for an emoji");
  await expect(search).toBeVisible();
  await search.fill("thumbs up");

  await page.locator("button.epr-emoji").first().click();

  await expect(page.locator('[aria-pressed="true"]').first()).toBeVisible();
});
