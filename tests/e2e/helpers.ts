import { expect, type Browser, type Locator, type Page } from "@playwright/test";

/**
 * These tests run against the real app (DATA_MODE=supabase) and create real accounts, so use a
 * separate Supabase project for testing. Each test student deletes its own account at the end.
 * The adviser account is shared and must be the first adviser in that project, because a student
 * is linked to the first adviser.
 */

export const PASSWORD = "e2e-password-123";
export const ADVISER_EMAIL = "e2e-adviser@example.test";
const MODULES = [
  "Basic of Programming",
  "Basic of Software Testing",
  "Software Modelling & Requirements Engineering",
  "Quality Assurance & Control",
  "Android Programming",
  "Advanced Web Programming",
];

/** Routes a signed-in student with a target and a plan can open. */
export const STUDENT_ROUTES = [
  "/map",
  "/matches",
  "/matches/2519-01",
  "/plan",
  "/practice",
  "/practice/execute-integration-testing",
  "/practice/execute-integration-testing/check",
  "/interview",
  "/bookings",
  "/bookings/new",
  "/settings",
  "/delete-my-data",
];
export const PUBLIC_ROUTES = ["/sign-in", "/sign-up", "/legal/privacy", "/legal/processors", "/legal/terms", "/legal/ai", "/legal/sources", "/legal/accessibility"];

const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Signs up a new student, accepts the consent screen with only the boxes asked for, and lands on the Map. */
export async function newStudent(page: Page, opts: { ai?: boolean; adviser?: boolean } = {}) {
  const id = unique();
  const email = `e2e-student-${id}@example.test`;
  const name = `Test Student ${id}`;
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByLabel("Semester").selectOption("5");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  // Nothing is ticked for the student.
  for (const box of await page.getByRole("checkbox").all()) await expect(box).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Store and use my data/ }).check();
  if (opts.ai) await page.getByRole("checkbox", { name: /external AI provider/ }).check();
  if (opts.adviser) await page.getByRole("checkbox", { name: /career adviser see my progress/ }).check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await expect(page).toHaveURL(/\/map$/);
  return { email, name };
}

/** Ticks all six modules, then makes 2519-01 System Tester the target. */
export async function tickModulesAndTarget(page: Page) {
  await page.goto("/map");
  for (const m of MODULES) {
    const box = page.getByRole("checkbox", { name: m });
    if (!(await box.isChecked())) {
      // Each tick is saved by a server action; wait for it so the next page sees it.
      const saved = page.waitForResponse((r) => r.request().method() === "POST");
      await box.check();
      await saved;
    }
  }
  await page.goto("/matches/2519-01");
  await page.getByRole("button", { name: "Choose as my target" }).click();
  await expect(page).toHaveURL(/\/plan$/);
}

/** Rates the three gap skills and builds the plan. */
export async function buildPlan(page: Page, ratings: [string, number][]) {
  await page.goto("/plan");
  for (const [skill, value] of ratings) {
    await page.getByRole("group", { name: skill }).getByRole("radio", { name: `${value} of 5` }).check();
  }
  await page.getByRole("button", { name: "Build my plan" }).click();
}

/** Deletes the signed-in student's account through Settings, which is also what a real student does. */
export async function deleteAccount(page: Page) {
  await page.goto("/delete-my-data");
  await page.getByRole("button", { name: "Delete my account and data" }).click();
  await expect(page).toHaveURL(/\/sign-in/);
}

/** Signs in the shared test adviser in a fresh browser context, creating it the first time. */
export async function adviserPage(browser: Browser): Promise<Page> {
  const code = process.env.STAFF_INVITE_CODE;
  if (!code) throw new Error("Set STAFF_INVITE_CODE in .env.local; the adviser test account needs it.");
  const page = await (await browser.newContext()).newPage();
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ADVISER_EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  if (await page.getByText("don't match an account").isVisible().catch(() => false)) {
    await page.goto("/sign-up");
    await page.getByRole("radio", { name: /A career adviser/ }).check();
    await page.getByLabel("Full name").fill("Test Adviser");
    await page.getByLabel("Email").fill(ADVISER_EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByLabel("Staff code").fill(code);
    await page.getByRole("button", { name: "Create account" }).click();
  }
  if (/\/staff\/undertaking$/.test(page.url()) || (await page.getByRole("heading", { name: "Staff confidentiality undertaking" }).isVisible().catch(() => false))) {
    await page.getByRole("checkbox", { name: /I agree to it/ }).check();
    await page.getByRole("button", { name: "Accept and open my dashboard" }).click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Students" })).toBeVisible();
  return page;
}

/** Press Tab until `target` has focus. Fails if it cannot be reached, so unreachable controls show up. */
export async function tabTo(page: Page, target: Locator, max = 120) {
  for (let i = 0; i < max; i++) {
    const focused = await target.evaluate((el) => el === document.activeElement).catch(() => false);
    if (focused) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Could not reach ${target} with Tab in ${max} presses`);
}

/** Focus ring is drawn, and the element is not hidden under the sticky header. */
export async function expectFocusVisible(page: Page) {
  const info = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const header = document.querySelector<HTMLElement>(".site-header");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    // Radios and checkboxes draw their ring on the wrapping label.
    const label = el.closest("label");
    const ls = label ? getComputedStyle(label) : null;
    const ring = (s: CSSStyleDeclaration | null) => !!s && s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
    return {
      name: `${el.tagName.toLowerCase()} ${el.textContent?.trim().slice(0, 40) ?? ""}`,
      ring: ring(cs) || ring(ls) || (label?.matches(":has(:focus-visible)") ?? false),
      hidden: rect.top < headerBottom - 1 && rect.bottom > 0,
    };
  });
  expect(info, "something has focus").not.toBeNull();
  expect(info!.ring, `focus ring on ${info!.name}`).toBe(true);
  expect(info!.hidden, `${info!.name} is under the header`).toBe(false);
}

/** Tab to a control, check focus, then press a key. */
export async function pressOn(page: Page, target: Locator, key: "Enter" | "Space" = "Enter") {
  await tabTo(page, target);
  await expectFocusVisible(page);
  await page.keyboard.press(key);
}

/** Tab into a radio group, then use arrow keys to land on option `index` (0-based). */
export async function chooseByArrows(page: Page, radios: Locator, index: number) {
  await tabTo(page, radios.first());
  await expectFocusVisible(page);
  for (let i = 0; i < index; i++) await page.keyboard.press("ArrowRight");
  await expect(radios.nth(index)).toBeChecked();
}

/** Anything that leaves the page: every non-GET request and every fetch/XHR that is not Next's own plumbing. */
export function watchNetwork(page: Page) {
  const calls: string[] = [];
  page.on("request", (r) => {
    const url = r.url();
    if (url.includes("/_next/") || url.includes("_rsc=")) return;
    if (r.method() !== "GET" || ["fetch", "xhr"].includes(r.resourceType())) calls.push(`${r.method()} ${url}`);
  });
  return calls;
}
