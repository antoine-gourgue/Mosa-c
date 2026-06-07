import { expect, test } from "@playwright/test";

test("a pin exposes its image in Open Graph metadata", async ({ page }) => {
  await page.goto("/pin/pin_1");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Lago di Braies, Dolomites",
  );
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  expect(ogImage).toContain("images.unsplash.com");
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("the brand Open Graph image renders as a PNG", async ({ page }) => {
  await page.goto("/");
  const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content");
  const response = await page.request.get(ogImage ?? "");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
});
