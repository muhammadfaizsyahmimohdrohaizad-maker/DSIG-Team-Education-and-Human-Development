import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ADVISER_ROUTES, freshDemo, STUDENT_ROUTES } from "./helpers";

const WIDTHS = [375, 1280];

/** The feedback page needs an answer, so the demo creates one through the interview. */
async function feedbackRoute(page: Page) {
  await page.goto("/interview");
  await page.getByLabel("Your answer").fill("I tested the checkout form and found a date bug. I fixed it and re-ran the tests.");
  await page.getByRole("button", { name: "Send answer" }).click();
  await expect(page).toHaveURL(/\/feedback\//);
  return new URL(page.url()).pathname;
}

async function checkPage(page: Page, route: string) {
  await page.goto(route);
  await expect(page.locator("h1").first()).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${route} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);

  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const serious = axe.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(serious, `${route} axe`).toEqual([]);

  const unlabelled = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLInputElement>("input, textarea, select")]
      .filter((el) => !["hidden", "submit"].includes(el.type))
      .filter((el) => {
        const text = [...(el.labels ?? [])].map((l) => l.textContent?.trim() ?? "").join("");
        return !text && !el.getAttribute("aria-labelledby");
      })
      .map((el) => el.id || el.name || el.tagName),
  );
  expect(unlabelled, `${route} fields without a visible label`).toEqual([]);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("every student route fits and passes axe", async ({ page }) => {
      await freshDemo(page);
      for (const route of STUDENT_ROUTES) await test.step(route, () => checkPage(page, route));
      await test.step("feedback", async () => checkPage(page, await feedbackRoute(page)));
    });

    test("the adviser dashboard fits and passes axe", async ({ page }) => {
      await freshDemo(page);
      for (const route of ADVISER_ROUTES) await test.step(route, () => checkPage(page, route));
    });

    test("the skill drawer and cancel dialog pass axe while open", async ({ page }) => {
      await freshDemo(page);
      await page.getByRole("button", { name: /report test findings/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const drawer = await new AxeBuilder({ page }).analyze();
      expect(drawer.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
      await page.keyboard.press("Escape");

      await page.goto("/adviser");
      await page.getByRole("button", { name: /^Accept for Aina/ }).click();
      await page.getByRole("button", { name: /^Cancel booking for Aina/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      const modal = await new AxeBuilder({ page }).analyze();
      expect(modal.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    });
  });
}

test("reduced motion removes the radar and drawer transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await freshDemo(page);
  const radar = await page.locator(".radar .shape").evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(radar).toBe("0s");
  await page.getByRole("button", { name: /report test findings/i }).click();
  const drawer = await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).animationName);
  expect(drawer).toBe("none");
});
