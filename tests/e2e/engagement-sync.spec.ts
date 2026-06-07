import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a like from the grid is reflected in the pin detail modal", async ({ page }) => {
  await login(page);
  await page.goto("/");

  const card = page.locator("[data-pin-card]").first();
  await card.hover();

  const cardToggle = card.getByRole("button", { name: /^(Like|Unlike)$/ });
  const initial = await cardToggle.getAttribute("aria-label");
  const next = initial === "Like" ? "Unlike" : "Like";

  await cardToggle.click();
  await expect(card.getByRole("button", { name: next, exact: true })).toBeVisible();

  await card.locator("a[href^='/pin/']").first().click();
  const dialog = page.getByRole("dialog", { name: "Pin detail" });
  await expect(dialog).toBeVisible();

  // the modal's like button reflects the state set from the grid via the store
  const modalToggle = dialog.getByRole("button", { name: next, exact: true });
  await expect(modalToggle).toBeVisible();

  // revert from the modal to leave the shared dev DB as we found it
  await modalToggle.click();
  await expect(dialog.getByRole("button", { name: initial ?? "Like", exact: true })).toBeVisible();
});
