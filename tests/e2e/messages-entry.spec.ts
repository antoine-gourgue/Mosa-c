import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can message someone from their profile", async ({ page }) => {
  await login(page);
  await page.goto("/u/mira");

  await page.getByRole("button", { name: "Message", exact: true }).click();

  await expect(page).toHaveURL(/\/messages\?c=/);
  await expect(page.getByText("Loved your latest board")).toBeVisible();
});

test("a user can accept an incoming message request", async ({ page }) => {
  await login(page);
  await page.goto("/messages");

  await page.getByRole("button", { name: /Requests/ }).click();
  await page.getByRole("button", { name: /Studio Atlas/ }).click();
  await expect(page.getByText("can we chat")).toBeVisible();

  await page.getByRole("button", { name: "Accept", exact: true }).click();

  // once accepted, the composer replaces the accept/decline banner
  await expect(page.getByLabel("Message", { exact: true })).toBeVisible();
});
