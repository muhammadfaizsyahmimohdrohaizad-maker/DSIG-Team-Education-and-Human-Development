import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { chooseByArrows, expectFocusVisible, freshDemo, pressOn, tabTo, watchNetwork } from "./helpers";

type Lesson = {
  label: string;
  items: { id: string; question: string; modelAnswer: string }[];
  mastery: { text: string; options: string[]; key: number }[];
};
const read = <T>(file: string): T => JSON.parse(readFileSync(join(process.cwd(), file), "utf8")) as T;
const lesson = read<Lesson>("content/lessons/execute-integration-testing.json");
const hints = read<Record<string, { level: number; text: string }[]>>("content/llm/hint.json");

/** The first sentence is enough to tell whether the model answer is on the page. */
const excerpt = (text: string) => text.split("\n")[0].slice(0, 40);

test("a student completes the demo path with the keyboard only", async ({ page }) => {
  await test.step("start", async () => {
    await page.goto("/onboarding");
    await pressOn(page, page.getByLabel("I understand how my data is used"), "Space");
    await pressOn(page, page.getByRole("button", { name: "Start with the demo student" }));
    await expect(page).toHaveURL(/\/map$/);
    await freshDemo(page);
  });

  await test.step("map: the drawer opens, traps focus, and returns focus on Esc", async () => {
    const opener = page.getByRole("button", { name: /report test findings/i });
    await pressOn(page, opener);
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Check with adviser");
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press("Tab");
      const outside = await page.evaluate(() => {
        const el = document.activeElement;
        return !!el && el !== document.body && !el.closest("dialog");
      });
      expect(outside, "focus stays inside the drawer").toBe(false);
    }
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });

  await test.step("matches: 2519-01 is the top match", async () => {
    await pressOn(page, page.getByRole("link", { name: "View occupation matches" }));
    await expect(page).toHaveURL(/\/matches$/);
    await pressOn(page, page.getByRole("link", { name: "View 2519-01 details" }));
    await expect(page.getByText("Match 70%")).toBeVisible();
  });

  await test.step("plan: rate three gaps, weakest comes first", async () => {
    await pressOn(page, page.getByRole("link", { name: "Build my plan for this role" }));
    await expect(page).toHaveURL(/\/plan$/);
    const ratings: [string, number][] = [
      ["execute integration testing", 1],
      ["use test automation tools", 3],
      ["report test findings", 4],
    ];
    for (const [skill, value] of ratings) {
      await chooseByArrows(page, page.getByRole("group", { name: skill }).getByRole("radio"), value - 1);
    }
    await pressOn(page, page.getByRole("button", { name: "Build my plan" }));
    await expect(page.getByRole("heading", { name: /^1\. execute integration testing/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /^3\. report test findings/ })).toBeVisible();
    await pressOn(page, page.getByRole("link", { name: "Start lesson" }).first());
    await expect(page).toHaveURL(/\/practice\/execute-integration-testing$/);
  });

  await test.step("lesson: hints come one at a time, the model answer only after Check answer", async () => {
    for (let n = 0; n < lesson.items.length; n++) {
      const asked = await page.locator("#q-title").innerText();
      const item = lesson.items.find((i) => i.question === asked);
      expect(item, `question "${asked}" is in the lesson file`).toBeDefined();

      await tabTo(page, page.getByLabel("Your answer"));
      await page.keyboard.type("Integration tests check that real parts work together.");

      if (n === 0) {
        await expect(page.locator("main")).not.toContainText(excerpt(item!.modelAnswer));
        for (let shown = 1; shown <= 3; shown++) {
          await pressOn(page, page.getByRole("button", { name: /Show (a|another) hint/ }));
          await expect(page.getByRole("region", { name: /^Hint \d$/ })).toHaveCount(shown);
          await expect(page.getByRole("region", { name: `Hint ${shown}` })).toContainText(hints[item!.id][shown - 1].text);
        }
        await expect(page.getByRole("button", { name: /hint/i })).toHaveCount(0);
        await expect(page.locator("main")).not.toContainText(excerpt(item!.modelAnswer));
      }

      await pressOn(page, page.getByRole("button", { name: "Check answer" }));
      await expect(page.getByRole("heading", { name: "Model answer" })).toBeVisible();
      await expect(page.locator("main")).toContainText(excerpt(item!.modelAnswer));

      await chooseByArrows(page, page.getByRole("group", { name: "How did that go?" }).getByRole("radio"), 2);
      await pressOn(page, page.getByRole("button", { name: "Save and continue" }));
      await expect(page.getByText(/Saved\. Next review:/)).toBeVisible();
      await pressOn(page, page.getByRole("button", { name: /Go to question|Finish lesson/ }));
    }
    await expect(page.getByRole("heading", { name: "Lesson done" })).toBeVisible();
    await pressOn(page, page.getByRole("link", { name: "Take the mastery check" }));
    await expect(page).toHaveURL(/\/check$/);
  });

  await test.step("mastery check: no hints, 4 of 5 to pass, marked with no network call", async () => {
    await expect(page.getByRole("button", { name: /hint/i })).toHaveCount(0);
    await expect(page.getByText(/You need 4 of 5/)).toBeVisible();
    const calls = watchNetwork(page);
    for (const q of lesson.mastery) {
      await expect(page.getByText(q.text)).toBeVisible();
      await chooseByArrows(page, page.getByRole("radio"), q.key);
      await pressOn(page, page.getByRole("button", { name: /Save answer|Finish the check/ }));
    }
    await expect(page.getByRole("heading", { name: `${lesson.mastery.length} of ${lesson.mastery.length} correct. You passed.` })).toBeVisible();
    expect(calls, "marking made no network call").toEqual([]);
    await pressOn(page, page.getByRole("button", { name: "Back to my plan" }));
    await expect(page).toHaveURL(/\/plan$/);
  });

  await test.step("practice: the pass is remembered", async () => {
    await pressOn(page, page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Practice" }));
    await expect(page.getByRole("heading", { level: 1, name: "Today's practice" })).toBeVisible();
    await expect(page.locator("dl.stat-row")).toContainText(/Gap skills mastered\s*1 of 3/);
  });

  await test.step("interview: answer, then feedback with no grade", async () => {
    await pressOn(page, page.getByRole("link", { name: "Start interview" }));
    await expect(page).toHaveURL(/\/interview$/);
    await tabTo(page, page.getByLabel("Your answer"));
    await page.keyboard.type("In my checkout project I tested the form with the payment stub. I found a date bug and fixed it.");
    await pressOn(page, page.getByRole("button", { name: "Send answer" }));
    await expect(page).toHaveURL(/\/feedback\//);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: "Feedback on your answer" })).toBeVisible();
    await expect(main.getByRole("heading", { name: "One next step" })).toBeVisible();
    const text = await main.innerText();
    expect(text, "no percentage or x/y grade on the feedback page").not.toMatch(/\d+\s*%|\b\d+\s*\/\s*\d+\b/);
    await pressOn(page, page.getByRole("button", { name: "Add weak area to my reviews" }));
    await expect(page.getByText("Added to your reviews")).toBeVisible();
  });

  await test.step("hand-off: request a session", async () => {
    await pressOn(page, page.getByRole("main").getByRole("link", { name: "Talk to a human" }));
    await expect(page).toHaveURL(/\/bookings\/new$/);
    await page.getByLabel("Preferred date").fill("2026-10-23");
    await page.getByLabel("Preferred time").fill("15:00");
    await pressOn(page, page.getByRole("button", { name: "Request session" }));
    await expect(page.getByRole("heading", { name: "Request sent" })).toBeVisible();
    await expect(page.getByText("Requested", { exact: true })).toBeVisible();
  });

  await test.step("adviser: accept, and the cancel dialog needs a reason", async () => {
    await pressOn(page, page.getByRole("contentinfo").getByRole("link", { name: "Adviser" }));
    await expect(page.getByRole("heading", { level: 1, name: "Students" })).toBeVisible();
    const row = page.getByRole("row", { name: /Aina/ });
    await expect(row).toContainText("Requested");
    await pressOn(page, row.getByRole("button", { name: /^Accept for Aina/ }));
    await expect(row).toContainText("Accepted");

    const opener = row.getByRole("button", { name: /^Cancel booking for Aina/ });
    await pressOn(page, opener);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel booking", exact: true }).press("Enter");
    await expect(dialog.getByText("Add a reason. The student will see it.")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expectFocusVisible(page);
  });

  await test.step("student: the new status shows first in the app", async () => {
    await pressOn(page, page.getByRole("contentinfo").getByRole("link", { name: "Student" }));
    await expect(page.getByRole("navigation", { name: "Main" })).toContainText("1 update");
    await pressOn(page, page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Bookings/ }));
    await expect(page.getByRole("heading", { level: 1, name: "My bookings" })).toBeVisible();
    await expect(page.getByText("Accepted", { exact: true })).toBeVisible();
  });
});

test("the adviser's cancel needs a reason and the student sees it", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/adviser");
  const row = page.getByRole("row", { name: /Aina/ });
  await row.getByRole("button", { name: /^Accept for Aina/ }).click();
  await expect(row).toContainText("Accepted");
  await row.getByRole("button", { name: /^Cancel booking for Aina/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason for cancelling").fill("The room is booked for a talk. Please pick another day.");
  await dialog.getByRole("button", { name: "Cancel booking", exact: true }).click();
  await expect(row).toContainText("Cancelled");

  await page.goto("/bookings");
  await expect(page.getByText("The room is booked for a talk. Please pick another day.")).toBeVisible();
});

test("the radar chart and its table show the same numbers", async ({ page }) => {
  await freshDemo(page);
  const table = await page.locator("#coverage-table tbody tr").evaluateAll((rows) =>
    rows.map((r) => Number.parseInt(r.querySelector("td")!.textContent!, 10)),
  );
  const chart = await page.locator(".radar circle.dot").evaluateAll((dots) =>
    dots.map((d) => {
      const x = Number(d.getAttribute("cx")) - 260;
      const y = Number(d.getAttribute("cy")) - 200;
      return Math.round((Math.hypot(x, y) / 130) * 100);
    }),
  );
  expect(table).toHaveLength(6);
  expect(chart).toEqual(table.map((v) => Math.max(v, 2)));
});

test("the model answer is not in the page source before Check answer", async ({ page }) => {
  await freshDemo(page);
  await page.goto("/practice/execute-integration-testing");
  const html = await page.content();
  for (const item of lesson.items) expect(html).not.toContain(excerpt(item.modelAnswer));
  for (const list of Object.values(hints)) for (const h of list) expect(html).not.toContain(h.text);
});
