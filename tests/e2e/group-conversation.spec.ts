import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can create a group conversation", async ({ page }) => {
  await login(page);
  await page.goto("/");

  await page.getByRole("button", { name: "Messages" }).first().click();
  await page.getByRole("button", { name: "New message" }).click();

  const search = page.getByPlaceholder("Search by name or username");
  await search.fill("mira");
  await page.getByRole("button", { name: /Mira/ }).first().click();
  await search.fill("north");
  await page
    .getByRole("button", { name: /Northlight/ })
    .first()
    .click();

  await page.getByLabel("Group name").fill("Trip crew");
  await page.getByRole("button", { name: /Create group/ }).click();

  await expect(page.getByText("Trip crew")).toBeVisible();
  await expect(page.getByText(/3 members/)).toBeVisible();
});
