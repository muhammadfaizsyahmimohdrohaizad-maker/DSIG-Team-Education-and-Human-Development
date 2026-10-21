import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import {
  adviserPage,
  buildPlan,
  chooseByArrows,
  deleteAccount,
  newStudent,
  pressOn,
  tabTo,
  tickModulesAndTarget,
  watchNetwork,
} from "./helpers";

type Lesson = {
  label: string;
  items: { id: string; question: string; modelAnswer: string }[];
  mastery: { text: string; options: string[]; key: number }[];
};
const read = <T>(file: string): T => JSON.parse(readFileSync(join(process.cwd(), file), "utf8")) as T;
const lesson = read<Lesson>("content/lessons/execute-integration-testing.json");
const hints = read<Record<string, { level: number; text: string }[]>>("content/llm/hint.json");
const excerpt = (text: string) => text.split("\n")[0].slice(0, 40);

test("signed-out visitors are sent to sign-in, and legal pages stay public", async ({ page }) => {
  await page.goto("/map");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmap$/);
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy notice" })).toBeVisible();
  await expect(page.getByText("Draft for legal review")).toBeVisible();
});

test("a student goes from sign-up to an adviser booking, using the keyboard where it matters", async ({ page, browser }) => {
  // AI is left off, so hints are the vetted static ones and the run makes no model calls.
  const student = await newStudent(page, { adviser: true });

  await test.step("consent is recorded", async () => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Your consent record" })).toBeVisible();
    await expect(page.locator("dl.stat-row").first()).toContainText(/AI hints and feedback\s*No/);
  });

  await test.step("map and target", async () => {
    await tickModulesAndTarget(page);
    await expect(page.getByRole("heading", { level: 1, name: /Your gap skills for System Tester/ })).toBeVisible();
  });

  await test.step("plan: rate the gaps, weakest first", async () => {
    await buildPlan(page, [
      ["execute integration testing", 1],
      ["use test automation tools", 3],
      ["report test findings", 4],
    ]);
    await expect(page.getByRole("heading", { name: /^1\. execute integration testing/ })).toBeVisible();
    await page.getByRole("link", { name: "Start lesson" }).first().click();
    await expect(page).toHaveURL(/\/practice\/execute-integration-testing$/);
  });

  await test.step("lesson: static hints one at a time, model answer only after Check answer", async () => {
    for (let n = 0; n < lesson.items.length; n++) {
      const asked = await page.locator("#q-title").innerText();
      const item = lesson.items.find((i) => i.question === asked)!;
      expect(item, `question "${asked}" is in the lesson file`).toBeDefined();
      await tabTo(page, page.getByLabel("Your answer"));
      await page.keyboard.type("Integration tests check that real parts work together.");
      if (n === 0) {
        for (let shown = 1; shown <= 3; shown++) {
          await pressOn(page, page.getByRole("button", { name: /Show (a|another) hint/ }));
          await expect(page.getByRole("region", { name: `Hint ${shown}` })).toContainText(hints[item.id][shown - 1].text);
        }
        await expect(page.locator("main")).not.toContainText(excerpt(item.modelAnswer));
      }
      await pressOn(page, page.getByRole("button", { name: "Check answer" }));
      await expect(page.locator("main")).toContainText(excerpt(item.modelAnswer));
      await chooseByArrows(page, page.getByRole("group", { name: "How did that go?" }).getByRole("radio"), 2);
      await pressOn(page, page.getByRole("button", { name: "Save and continue" }));
      await expect(page.getByText(/Saved\. Next review:/)).toBeVisible();
      await pressOn(page, page.getByRole("button", { name: /Go to question|Finish lesson/ }));
    }
    await expect(page.getByRole("heading", { name: "Lesson done" })).toBeVisible();
  });

  await test.step("mastery check: AI is off, 4 of 5, marked with no network call", async () => {
    await page.getByRole("link", { name: "Take the mastery check" }).click();
    await expect(page.getByText("AI is off")).toBeVisible();
    await expect(page.getByRole("button", { name: /hint/i })).toHaveCount(0);
    const calls = watchNetwork(page);
    for (const q of lesson.mastery) {
      await expect(page.getByText(q.text)).toBeVisible();
      await chooseByArrows(page, page.getByRole("radio"), q.key);
      await pressOn(page, page.getByRole("button", { name: /Save answer|Finish the check/ }));
    }
    await expect(page.getByRole("heading", { name: `${lesson.mastery.length} of ${lesson.mastery.length} correct. You passed.` })).toBeVisible();
    expect(calls, "marking made no network call").toEqual([]);
    await page.getByRole("button", { name: "Back to my plan" }).click();
    await page.goto("/practice");
    await expect(page.locator("dl.stat-row")).toContainText(/Gap skills mastered\s*1 of 3/);
  });

  await test.step("interview without AI consent: the answer goes to an adviser", async () => {
    await page.goto("/interview");
    await expect(page.getByText(/Source: eMASCO 2519, task/)).toBeVisible();
    await page.getByLabel("Your answer").fill("In my QA project I tested a checkout form and found a date bug.");
    await page.getByRole("button", { name: "Send answer" }).click();
    await expect(page).toHaveURL(/\/feedback\//);
    await expect(page.getByText("Needs adviser")).toBeVisible();
    const text = await page.getByRole("main").innerText();
    expect(text, "no grade on the feedback page").not.toMatch(/\d+\s*%|\b\d+\s*\/\s*\d+\b/);
  });

  const adviser = await adviserPage(browser);
  const slotDay = new Date(Date.now() + 2 * 86_400_000 + 8 * 3_600_000).toISOString().slice(0, 10);

  await test.step("hand-off: request a session", async () => {
    await page.getByRole("main").getByRole("link", { name: "Talk to a human" }).click();
    await expect(page.getByRole("heading", { name: "What your adviser will see" })).toBeVisible();
    await page.getByLabel("Preferred date").fill(slotDay);
    await page.getByLabel("Preferred time").fill("15:00");
    await page.getByRole("button", { name: "Request session" }).click();
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible();
  });

  await test.step("adviser: sees progress read-only, accepts, and cancelling needs a reason", async () => {
    await adviser.reload();
    const row = adviser.getByRole("row", { name: new RegExp(student.name) });
    await expect(row).toContainText("2519-01 System Tester");
    await expect(row).toContainText("Requested");
    await row.getByRole("button", { name: new RegExp(`^Accept for ${student.name}`) }).click();
    await expect(row).toContainText("Accepted");
    await row.getByRole("button", { name: new RegExp(`^Cancel booking for ${student.name}`) }).click();
    const dialog = adviser.getByRole("dialog");
    await dialog.getByRole("button", { name: "Cancel booking", exact: true }).click();
    await expect(dialog.getByText("Add a reason. The student will see it.")).toBeVisible();
    await dialog.getByLabel("Reason for cancelling").fill("The room is booked for a talk. Please pick another day.");
    await dialog.getByRole("button", { name: "Cancel booking", exact: true }).click();
    await expect(row).toContainText("Cancelled");
  });

  await test.step("student: sees who cancelled and why", async () => {
    await page.goto("/bookings");
    await expect(page.getByText("cancelled by your adviser")).toBeVisible();
    await expect(page.getByText("The room is booked for a talk. Please pick another day.")).toBeVisible();
  });

  await test.step("export and delete", async () => {
    const res = await page.request.get("/settings/export");
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.consents.length).toBeGreaterThan(0);
    expect(data.answers.length).toBe(1);
    await deleteAccount(page);
    await page.goto("/map");
    await expect(page).toHaveURL(/\/sign-in/);
  });
  await adviser.context().close();
});

test("a student who keeps progress private is not shown to the adviser", async ({ page, browser }) => {
  const student = await newStudent(page, { adviser: false });
  await tickModulesAndTarget(page);
  const adviser = await adviserPage(browser);
  await expect(adviser.getByRole("row", { name: new RegExp(student.name) })).toHaveCount(0);
  await adviser.context().close();
  await deleteAccount(page);
});

test("the radar chart and its table show the same numbers", async ({ page }) => {
  await newStudent(page);
  await tickModulesAndTarget(page);
  await page.goto("/map");
  const table = await page.locator("#coverage-table tbody tr").evaluateAll((rows) =>
    rows.map((r) => Number.parseInt(r.querySelector("td")!.textContent!, 10)),
  );
  const chart = await page.locator(".radar circle.dot").evaluateAll((dots) =>
    dots.map((d) => Math.round((Math.hypot(Number(d.getAttribute("cx")) - 260, Number(d.getAttribute("cy")) - 200) / 130) * 100)),
  );
  expect(table).toHaveLength(6);
  expect(chart).toEqual(table.map((v) => Math.max(v, 2)));
  await deleteAccount(page);
});

test("the model answer and hints are not in the page source before they are asked for", async ({ page }) => {
  await newStudent(page);
  await page.goto("/practice/execute-integration-testing");
  const html = await page.content();
  for (const item of lesson.items) expect(html).not.toContain(excerpt(item.modelAnswer));
  for (const list of Object.values(hints)) if (Array.isArray(list)) for (const h of list) expect(html).not.toContain(h.text);
  await deleteAccount(page);
});
