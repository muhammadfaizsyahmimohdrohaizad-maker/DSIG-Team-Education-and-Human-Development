import { describe, expect, it } from "vitest";
import { aiAllowed, chooseProvider, createAi, parseCards, startOfDayMyt, stubProvider, validateFeedback, STUB_FEEDBACK, type AiBudget, type AiCallLog } from "@/server/llm/core.ts";

const adult = { id: "u1", isUnder18: false, aiConsent: true, fullName: "Aina Rahman" };
const budget = (used = 0): AiBudget & { seen: Date[] } => {
  const seen: Date[] = [];
  return { seen, async usedSince(_id, since) { seen.push(since); return used; } };
};
const input = { question: "What is overfitting?", answer: "My name is Aina Rahman, email aina@x.com. Overfitting is when a model learns noise.", missingPoints: ["validation set"], missingParts: [] };

describe("aiAllowed gate (Gemini terms: no under-18s)", () => {
  it("is off for under-18 accounts even with consent", () => {
    expect(aiAllowed({ isUnder18: true, aiConsent: true })).toBe(false);
  });
  it("is off without consent and on for 18+ with consent", () => {
    expect(aiAllowed({ isUnder18: false, aiConsent: false })).toBe(false);
    expect(aiAllowed({ isUnder18: false, aiConsent: true })).toBe(true);
  });
  it("never calls the provider or the budget for an under-18 account", async () => {
    const provider = stubProvider();
    const b = budget();
    const ai = createAi({ provider, budget: b });
    const r = await ai.feedback({ ...adult, isUnder18: true }, input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("FORBIDDEN");
    const c = await ai.cards({ ...adult, isUnder18: true }, "# Git\nA branch is a line of work.");
    expect(c.ok).toBe(false);
    expect(provider.calls).toHaveLength(0);
    expect(b.seen).toHaveLength(0);
  });
  it("never calls the provider without consent", async () => {
    const provider = stubProvider();
    const r = await createAi({ provider, budget: budget() }).feedback({ ...adult, aiConsent: false }, input);
    expect(r.ok).toBe(false);
    expect(provider.calls).toHaveLength(0);
  });
});

describe("provider choice (no stub text in production)", () => {
  it("is off by default, and off for gemini without a key", () => {
    expect(chooseProvider({ provider: "off", hasKey: true, production: true })).toBe("off");
    expect(chooseProvider({ provider: "gemini", hasKey: false, production: true })).toBe("off");
    expect(chooseProvider({ provider: "gemini", hasKey: true, production: true })).toBe("gemini");
  });
  it("refuses the stub in production and allows it elsewhere", () => {
    expect(chooseProvider({ provider: "stub", hasKey: false, production: true })).toBe("off");
    expect(chooseProvider({ provider: "stub", hasKey: false, production: false })).toBe("stub");
  });
  it("refuses every call when no provider is configured, before the budget", async () => {
    const b = budget();
    const ai = createAi({ provider: null, budget: b });
    const r = await ai.feedback(adult, input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("FORBIDDEN");
      expect(r.error.message).toMatch("isn't available");
    }
    expect((await ai.cards(adult, "# A\nb")).ok).toBe(false);
    expect(b.seen).toHaveLength(0);
  });
});

describe("rate limit", () => {
  it("refuses with a retryable error when the short-window limit is hit", async () => {
    const provider = stubProvider();
    const kinds: string[] = [];
    const r = await createAi({ provider, budget: budget(), rateLimit: async (_id, kind) => { kinds.push(kind); return false; } }).feedback(adult, input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("AI_ERROR");
      expect(r.error.message).toMatch("Wait a minute");
    }
    expect(kinds).toEqual(["interview_feedback"]);
    expect(provider.calls).toHaveLength(0);
  });
  it("fails closed when the limit can't be checked, and is not consulted past the budget", async () => {
    const provider = stubProvider();
    let asked = 0;
    const broken = createAi({ provider, budget: budget(), rateLimit: async () => { asked++; throw new Error("no fn"); } });
    expect((await broken.feedback(adult, input)).ok).toBe(false);
    const spent = createAi({ provider, budget: budget(9), dailyLimit: 9, rateLimit: async () => { asked++; return true; } });
    expect((await spent.feedback(adult, input)).ok).toBe(false);
    expect(asked).toBe(1);
    expect(provider.calls).toHaveLength(0);
  });
});

describe("guarded feedback call", () => {
  it("returns stub feedback and sends only redacted text", async () => {
    const provider = stubProvider();
    const r = await createAi({ provider, budget: budget() }).feedback(adult, input);
    expect(r).toEqual({ ok: true, value: STUB_FEEDBACK });
    const sent = provider.calls[0]!.user;
    expect(sent).not.toMatch("Aina");
    expect(sent).not.toMatch("aina@x.com");
    expect(sent).toMatch("[name]");
    expect(sent).toMatch("validation set");
    expect(provider.calls[0]!.system).toMatch("Never give a mark");
  });
  it("stops at the daily budget", async () => {
    const provider = stubProvider();
    const r = await createAi({ provider, budget: budget(5), dailyLimit: 5 }).feedback(adult, input);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe("FORBIDDEN");
      expect(r.error.message).toMatch("today's 5");
    }
    expect(provider.calls).toHaveLength(0);
  });
  it("fails closed when usage can't be counted", async () => {
    const provider = stubProvider();
    const broken: AiBudget = { async usedSince() { throw new Error("db down"); } };
    const r = await createAi({ provider, budget: broken }).feedback(adult, input);
    expect(r.ok).toBe(false);
    expect(provider.calls).toHaveLength(0);
  });
  it("counts the budget from midnight Malaysia time", async () => {
    const b = budget();
    await createAi({ provider: stubProvider(), budget: b, now: () => new Date("2026-11-11T17:30:00Z") }).feedback(adult, input);
    // 01:30 on 12 Nov in Malaysia, so the day started at 16:00 UTC on 11 Nov.
    expect(b.seen[0]!.toISOString()).toBe("2026-11-11T16:00:00.000Z");
    expect(startOfDayMyt(new Date("2026-11-11T15:59:00Z")).toISOString()).toBe("2026-11-10T16:00:00.000Z");
  });
  it("times out a slow provider, even one that ignores the abort signal", async () => {
    const slow = stubProvider(() => new Promise<string>((res) => setTimeout(() => res("late"), 200)));
    const r = await createAi({ provider: slow, budget: budget(), timeoutMs: 20 }).feedback(adult, input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("AI_TIMEOUT");
  });
  it("maps provider errors to AI_ERROR", async () => {
    const boom = stubProvider(() => { throw new Error("500"); });
    const r = await createAi({ provider: boom, budget: budget() }).feedback(adult, input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("AI_ERROR");
  });
  it("rejects output that carries a mark", async () => {
    const graded = stubProvider("Good answer, 4/5. Add a number.");
    const r = await createAi({ provider: graded, budget: budget() }).feedback(adult, input);
    expect(r.ok).toBe(false);
  });
});

describe("AI call log (ai_calls, for the budget)", () => {
  const logger = () => {
    const rows: [string, string, boolean][] = [];
    const log: AiCallLog = async (id, kind, ok) => { rows.push([id, kind, ok]); };
    return { rows, log };
  };
  it("logs successful feedback and card calls with their kind", async () => {
    const { rows, log } = logger();
    const ai = createAi({ provider: stubProvider(), budget: budget(), log });
    await ai.feedback(adult, input);
    await ai.cards(adult, "# Git\nA branch is a line of work.");
    expect(rows).toEqual([["u1", "interview_feedback", true], ["u1", "notes_cards", true]]);
  });
  it("logs failed and timed-out calls as not ok", async () => {
    const { rows, log } = logger();
    await createAi({ provider: stubProvider(() => { throw new Error("500"); }), budget: budget(), log }).feedback(adult, input);
    await createAi({ provider: stubProvider(() => new Promise<string>((res) => setTimeout(() => res("late"), 200))), budget: budget(), log, timeoutMs: 20 }).feedback(adult, input);
    expect(rows).toEqual([["u1", "interview_feedback", false], ["u1", "interview_feedback", false]]);
  });
  it("logs nothing when the gate or budget refuses, and survives a failing logger", async () => {
    const { rows, log } = logger();
    await createAi({ provider: stubProvider(), budget: budget(), log }).feedback({ ...adult, isUnder18: true }, input);
    await createAi({ provider: stubProvider(), budget: budget(3), dailyLimit: 3, log }).feedback(adult, input);
    expect(rows).toHaveLength(0);
    const broken: AiCallLog = async () => { throw new Error("db down"); };
    const r = await createAi({ provider: stubProvider(), budget: budget(), log: broken }).feedback(adult, input);
    expect(r.ok).toBe(true);
  });
});

describe("validateFeedback", () => {
  it("strips Markdown to plain text", () => {
    expect(validateFeedback("**Good** start.\n- Add a *result*.")).toEqual({ ok: true, value: "Good start. Add a result." });
  });
  it("rejects scores, grades and percentages", () => {
    for (const bad of ["You scored well.", "That is 3 out of 5.", "About 80% there.", "Grade: A+ overall.", "I'd rate it highly.", "Full marks."]) {
      expect(validateFeedback(bad).ok).toBe(false);
    }
  });
  it("keeps ordinary numbers and words like 'fails on new data'", () => {
    expect(validateFeedback("Say the model fails on new data, and give the 2 datasets you used.").ok).toBe(true);
  });
  it("cuts long output to whole sentences under the cap", () => {
    const long = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(" ");
    const r = validateFeedback(long);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.length).toBeLessThanOrEqual(600);
      expect(r.value.endsWith(".")).toBe(true);
    }
  });
  it("rejects empty output and links", () => {
    expect(validateFeedback("   ").ok).toBe(false);
    expect(validateFeedback("Read https://example.com first.").ok).toBe(false);
  });
});

describe("AI cards", () => {
  it("parses Q || A lines and drops anything else", () => {
    const raw = "Here are cards:\nQ: What does git switch do? || A: Moves you onto another branch.\n1. Q: **Merge conflict?** || A: Two branches change the same lines.\nnot a card";
    expect(parseCards(raw)).toEqual([
      { front: "What does git switch do?", back: "Moves you onto another branch." },
      { front: "Merge conflict?", back: "Two branches change the same lines." },
    ]);
  });
  it("makes cards through the same gate", async () => {
    const provider = stubProvider();
    const r = await createAi({ provider, budget: budget() }).cards(adult, "# Git\nAina's notes. A branch is a line of work.");
    expect(r.ok).toBe(true);
    expect(provider.calls[0]!.user).not.toMatch("Aina");
  });
});
