import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can message a mutual follow from their profile", async ({ page }) => {
  await login(page);
  await page.goto("/u/mira");

  await page.getByRole("button", { name: "Message", exact: true }).click();

  await expect(page).toHaveURL(/\/messages\?c=/);
  await expect(page.getByText("Loved your latest board")).toBeVisible();
});

test("the message button is hidden for non-mutual follows", async ({ page }) => {
  await login(page);
  await page.goto("/u/atlas");

  await expect(page.getByRole("button", { name: "Message", exact: true })).toHaveCount(0);
});
