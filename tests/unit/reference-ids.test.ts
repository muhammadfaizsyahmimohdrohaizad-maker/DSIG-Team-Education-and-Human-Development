import { expect, it } from "vitest";
import { interviewAnswer, bookingRequest, studyOptionInput } from "../../lib/schemas";

it("accepts the deterministic PostgreSQL IDs used by reference imports and demo slots", () => {
  const id = "19ef0b98-c96f-b95a-5ae7-cd85b275fb56";
  expect(interviewAnswer.safeParse({ questionId: id, text: "A team project", skipped: false }).success).toBe(true);
  expect(studyOptionInput.safeParse({ optionId: id }).success).toBe(true);
  expect(bookingRequest.safeParse({ slotId: id, requestId: "a223c38d-55eb-4a6a-bcb4-8cb2e52a6709", topic: "Projects", shared: [] }).success).toBe(true);
  expect(studyOptionInput.safeParse({ optionId: "malformed" }).success).toBe(false);
});
