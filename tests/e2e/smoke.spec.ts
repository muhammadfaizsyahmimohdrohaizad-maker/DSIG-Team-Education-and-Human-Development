import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Public pages render, have no sideways scroll and no WCAG 2.1 AA violations (NFR-10, NFR-13).
for (const path of ["/", "/sign-in", "/sign-up", "/privacy"]) {
  test(`public page ${path}`, async ({ page }) => {
    await page.goto("/careerprep" + path);
    await expect(page.locator("h1")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(a11y.violations).toEqual([]);
  });
}

test("student pages need a log-in", async ({ page }) => {
  await page.goto("/careerprep/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
