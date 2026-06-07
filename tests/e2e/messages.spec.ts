import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can open a conversation and send a message", async ({ page }) => {
  await login(page);
  await page.goto("/messages");

  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

  await page.getByRole("button", { name: /Mira Solène/ }).click();
  await expect(page.getByText("Loved your latest board")).toBeVisible();

  const text = `hello from e2e ${Date.now()}`;
  await page.getByLabel("Message", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.locator("section").getByText(text)).toBeVisible();
});
