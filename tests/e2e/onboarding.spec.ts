import "dotenv/config";
import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";

/**
 * Seeds a known verification code for an email by overwriting the hashed OTP the
 * signup step issued, so the verify form can be driven deterministically without
 * reading the emailed code.
 */
async function seedOtp(email: string, code: string): Promise<void> {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const codeHash = createHash("sha256").update(code).digest("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await client.query(
    `INSERT INTO "EmailOtp" (id, email, "codeHash", "expiresAt", attempts, "createdAt")
     VALUES ($1, $2, $3, $4, 0, NOW())
     ON CONFLICT (email)
     DO UPDATE SET "codeHash" = EXCLUDED."codeHash", "expiresAt" = EXCLUDED."expiresAt", attempts = 0`,
    [`otp_demo_${Date.now()}`, email, codeHash, expiresAt],
  );
  await client.end();
}

test.use({ video: "on", viewport: { width: 1280, height: 820 } });

test("sign up, complete interest onboarding, then land on the feed", async ({ page }) => {
  test.setTimeout(90_000);
  const stamp = Date.now();
  const email = `demo+${stamp}@mosaic.app`;
  const username = `demo${stamp}`.slice(0, 20);

  // Sign up.
  await page.goto("/sign-up");
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Age", { exact: true }).fill("25");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Create account" }).click();

  // Verify the email with a seeded code.
  await page.waitForURL(/\/verify/);
  await seedOtp(email, "123456");
  await page.getByLabel("Verification code").fill("123456");
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "Verify" }).click();

  // Interest onboarding.
  await page.waitForURL(/\/onboarding/);
  await expect(page.getByRole("heading")).toBeVisible();
  const chips = page.locator("main ul button[aria-pressed]");
  for (const index of [0, 1, 2, 3]) {
    await chips.nth(index).click();
    await page.waitForTimeout(350);
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // After onboarding: the home feed.
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 20_000 }).toBe("/");
  await page.waitForTimeout(2500);
});
