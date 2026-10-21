import { describe, expect, it } from "vitest";
import { extractJson, leaksAnswer } from "@/lib/llm/guards";

describe("extractJson", () => {
  it("reads plain JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("reads JSON inside a fence with text around it", () => {
    expect(extractJson('Here you go:\n```json\n{"hints":[1,2]}\n```\nDone.')).toEqual({ hints: [1, 2] });
  });
  it("returns null for text with no JSON", () => {
    expect(extractJson("Sorry, I can't help with that.")).toBe(null);
  });
  it("returns null for broken JSON", () => {
    expect(extractJson('{"a": }')).toBe(null);
  });
});

describe("leaksAnswer", () => {
  const model = "A unit test checks one component on its own, with the parts it depends on replaced by fakes.";
  it("flags a hint that copies a phrase from the model answer", () => {
    expect(leaksAnswer("Remember: a unit test checks one component on its own.", model)).toBe(true);
  });
  it("ignores case and punctuation", () => {
    expect(leaksAnswer("A UNIT TEST checks one component, on its own!", model)).toBe(true);
  });
  it("lets a hint that only shares a few words through", () => {
    expect(leaksAnswer("Think about how many parts each test touches at once.", model)).toBe(false);
  });
});
