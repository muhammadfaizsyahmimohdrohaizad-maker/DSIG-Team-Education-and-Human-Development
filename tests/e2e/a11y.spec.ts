import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { buildPlan, deleteAccount, newStudent, PUBLIC_ROUTES, STUDENT_ROUTES, tickModulesAndTarget } from "./helpers";

const WIDTHS = [375, 1280];

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
      .filter((el) => ![...(el.labels ?? [])].map((l) => l.textContent?.trim() ?? "").join("") && !el.getAttribute("aria-labelledby"))
      .map((el) => el.id || el.name || el.tagName),
  );
  expect(unlabelled, `${route} fields without a visible label`).toEqual([]);
}

for (const width of WIDTHS) {
  test.describe(`at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("public pages fit and pass axe", async ({ page }) => {
      for (const route of PUBLIC_ROUTES) await test.step(route, () => checkPage(page, route));
    });

    test("the consent screen and every student page fit and pass axe", async ({ page }) => {
      await page.goto("/sign-up");
      await newStudent(page);
      await tickModulesAndTarget(page);
      await buildPlan(page, [
        ["execute integration testing", 2],
        ["use test automation tools", 2],
        ["report test findings", 2],
      ]);
      for (const route of STUDENT_ROUTES) await test.step(route, () => checkPage(page, route));
      await deleteAccount(page);
    });
  });
}

test("reduced motion removes the radar and drawer transitions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await newStudent(page);
  await tickModulesAndTarget(page);
  await page.goto("/map");
  expect(await page.locator(".radar .shape").evaluate((el) => getComputedStyle(el).transitionDuration)).toBe("0s");
  await page.getByRole("button", { name: /report test findings/i }).click();
  expect(await page.getByRole("dialog").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
  await page.keyboard.press("Escape");
  await deleteAccount(page);
});
