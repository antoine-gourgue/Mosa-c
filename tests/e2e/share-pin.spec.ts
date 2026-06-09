import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can share a pin into a direct message", async ({ page }) => {
  await login(page);
  await page.goto("/pin/pin_1");

  await page.getByLabel("Share in a message").click();
  await page.getByPlaceholder("Search people").fill("mira");
  await page.getByRole("button", { name: /Mira/ }).first().click();
  await expect(page.getByText(/Sent to Mira/)).toBeVisible();

  await page.getByRole("button", { name: "Messages" }).first().click();
  const miraConversation = page
    .getByRole("button")
    .filter({ hasText: "Mira" })
    .filter({ hasText: "Sent a pin" });
  await expect(miraConversation.first()).toBeVisible();
});
