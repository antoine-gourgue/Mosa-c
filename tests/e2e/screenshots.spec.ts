import { test } from "@playwright/test";
import { login } from "./helpers";

/**
 * README screenshot capture. Off by default so it never runs in the normal e2e
 * suite; run it with `npm run screenshots` (set `CAPTURE_SCREENSHOTS=1`) against
 * a seeded database to refresh the images in `.github/screenshots/`.
 */
test.skip(
  !process.env.CAPTURE_SCREENSHOTS,
  "Set CAPTURE_SCREENSHOTS=1 (npm run screenshots) to capture README images.",
);

test.use({ viewport: { width: 1440, height: 900 } });

const DIR = ".github/screenshots";

/**
 * The pages to capture, in gallery order. `wait` is bumped for map pages so the
 * Leaflet tiles finish loading before the shot.
 */
const shots: { name: string; path: string; wait?: number }[] = [
  { name: "home", path: "/", wait: 1800 },
  { name: "pin", path: "/pin/pin_1", wait: 3000 },
  { name: "place", path: "/place/lago-di-braies", wait: 3000 },
  { name: "boards", path: "/u/you?tab=boards", wait: 1500 },
  { name: "create", path: "/create", wait: 1500 },
  { name: "search", path: "/search?q=paris", wait: 1800 },
  { name: "messages", path: "/messages", wait: 1500 },
  { name: "profile", path: "/u/you", wait: 1800 },
  { name: "drafts", path: "/u/you?tab=drafts", wait: 1500 },
  { name: "settings", path: "/settings", wait: 1200 },
  { name: "analytics", path: "/settings/analytics", wait: 1800 },
];

test("capture README screenshots", async ({ page }) => {
  test.setTimeout(240_000);
  await login(page);
  for (const shot of shots) {
    try {
      await page.goto(shot.path, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(shot.wait ?? 1200);
      await page.screenshot({ path: `${DIR}/${shot.name}.png` });
    } catch (error) {
      console.warn(`Screenshot failed for ${shot.path}:`, (error as Error).message);
    }
  }
});
