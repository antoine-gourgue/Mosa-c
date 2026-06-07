import { expect, test } from "@playwright/test";
import { login } from "./helpers";

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

test("robots, sitemap and manifest are public", async ({ page }) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");

  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("/pin/");

  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.status()).toBe(200);
  expect(((await manifest.json()) as { name: string }).name).toBe("Mosaic");
});

test("a public pin declares a canonical url", async ({ page }) => {
  await page.goto("/pin/pin_1");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/pin\/pin_1$/);
});

test("private routes are marked noindex", async ({ page }) => {
  await login(page);
  await page.goto("/create");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
