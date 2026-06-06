import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { login } from "./helpers";

const paths = ["/", "/search?q=mountains", "/boards", "/notifications", "/create"];

for (const path of paths) {
  test(`no serious accessibility violations on ${path}`, async ({ page }) => {
    await login(page);
    await page.goto(path);
    // goto resolves on the load event (avoid networkidle, which never settles
    // under the dev server's HMR socket). Give the GSAP entrance animations
    // time to finish so text is scanned at full opacity, not mid-fade.
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(JSON.stringify(serious.map((violation) => violation.id))).toBe("[]");
  });
}
