import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("uploading an image and publishing creates a pin on the board", async ({ page }) => {
  await login(page);
  await page.goto("/create");

  await page.setInputFiles('input[type="file"]', "public/images/pug.png");
  await expect(page.getByLabel("Selected preview")).toBeVisible();

  const title = `Playwright Pin ${Date.now()}`;
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Publish" }).click();

  await page.waitForURL("/boards");
  await expect(page.getByText(title)).toBeVisible();
});
