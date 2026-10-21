import { expect, type Locator, type Page } from "@playwright/test";

/** Routes a student can reach with no setup. Dynamic ones use the demo data. */
export const STUDENT_ROUTES = [
  "/onboarding",
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
  "/delete-my-data",
];
export const ADVISER_ROUTES = ["/adviser"];

/** Accept the consent screen, then put the demo data back to its starting state. */
export async function freshDemo(page: Page) {
  await page.goto("/onboarding");
  await page.getByLabel("I understand how my data is used").check();
  await page.getByRole("button", { name: "Start with the demo student" }).click();
  await expect(page).toHaveURL(/\/map$/);
  const reset = page.waitForResponse((r) => r.request().method() === "POST");
  await page.getByRole("button", { name: "Reset demo data" }).click();
  await reset;
  await expect(page.getByRole("heading", { level: 1, name: "Your modules, mapped to skills" })).toBeVisible();
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
