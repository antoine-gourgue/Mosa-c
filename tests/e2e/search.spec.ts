import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("searching filters pins and shows an empty state", async ({ page }) => {
  await login(page);
  await page.goto("/search?q=pizza");
  await expect(page.getByText("Wood-fired pizza")).toBeVisible();

  await page.goto("/search?q=zzqqxx-no-match");
  await expect(page.getByText(/No ideas matched/i)).toBeVisible();
});

test("the discovery view shows popular tags with no query", async ({ page }) => {
  await login(page);
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: "Ideas for you" })).toBeVisible();
  await expect(page.getByRole("link", { name: /#Travel/ })).toBeVisible();
});

test("a tag page lists the pins carrying it", async ({ page }) => {
  await login(page);
  await page.goto("/tag/travel");
  await expect(page.getByRole("heading", { name: "#Travel" })).toBeVisible();
  await expect(page.getByText("Lago di Braies, Dolomites")).toBeVisible();
});
