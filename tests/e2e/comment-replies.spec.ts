import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can reply to a comment and post with Enter", async ({ page }) => {
  await login(page);
  await page.goto("/pin/pin_1");
  await expect(page.getByText(/Stunning shot/)).toBeVisible();
  await page.getByRole("button", { name: "Reply", exact: true }).first().click();
  const reply = page.getByLabel("Reply");
  await reply.fill("Totally agree!");
  await reply.press("Enter");
  await expect(page.getByText("Totally agree!")).toBeVisible();
});
