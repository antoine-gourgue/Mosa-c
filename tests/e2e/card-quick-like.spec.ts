import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("a user can like a pin from the card hover", async ({ page }) => {
  await login(page);
  await page.goto("/");

  const card = page.locator("[data-pin-card]").first();
  await card.hover();

  const toggle = card.getByRole("button", { name: /^(Like|Unlike)$/ });
  const initial = await toggle.getAttribute("aria-label");
  const next = initial === "Like" ? "Unlike" : "Like";

  await toggle.click();
  await expect(card.getByRole("button", { name: next, exact: true })).toBeVisible();

  await card.getByRole("button", { name: next, exact: true }).click();
  await expect(card.getByRole("button", { name: initial ?? "Like", exact: true })).toBeVisible();
});
