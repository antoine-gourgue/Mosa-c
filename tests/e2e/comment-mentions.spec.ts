import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can mention another user with autocomplete", async ({ page }) => {
  await login(page);
  await page.goto("/pin/pin_1");

  const composer = page.getByLabel("Add a comment");
  await composer.click();
  await composer.pressSequentially("hey @mir");

  const option = page.getByRole("button", { name: /Mira Solène/ });
  await expect(option).toBeVisible();
  await option.click();

  await expect(composer).toHaveValue(/@mira/);
  await composer.press("Enter");

  await expect(page.getByRole("link", { name: "@mira" }).first()).toBeVisible();
});
