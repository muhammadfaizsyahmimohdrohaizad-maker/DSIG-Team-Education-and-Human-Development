import { describe, expect, it } from "vitest";
import { redact } from "@/server/llm/redact.ts";

describe("redact", () => {
  it("removes emails, links and bare domains", () => {
    expect(redact("Email me at aina.rahman@student.gmi.edu.my or see https://github.com/aina/faq-bot and aina.dev/cv"))
      .toBe("Email me at [email] or see [link] and [link]");
  });
  it("removes Malaysian IC numbers with or without dashes", () => {
    expect(redact("My IC is 050312-10-1234.")).toBe("My IC is [id number].");
    expect(redact("IC 050312101234 here")).toBe("IC [id number] here");
  });
  it("removes Malaysian phone numbers", () => {
    expect(redact("Call 012-345 6789 or +60 12-345 6789 or 03-7956 1234")).toBe("Call [phone] or [phone] or [phone]");
  });
  it("removes the student's own name and its parts", () => {
    expect(redact("I am Aina Rahman. Aina built it.", ["Aina Rahman"])).toBe("I am [name]. [name] built it.");
    expect(redact("Muthu did the UI", ["Muthu a/l Rajan"])).toBe("[name] did the UI");
  });
  it("removes names after 'my name is', titles, patronymics and role words", () => {
    expect(redact("Hi, my name is Nur Aisyah and I like data.")).toBe("Hi, my name is [name] and I like data.");
    expect(redact("Sir Firdaus checked it.")).toBe("[name] checked it.");
    expect(redact("I asked Encik Ahmad Faizal for help.")).toBe("I asked [name] for help.");
    expect(redact("It was Ahmad bin Ismail who merged it.")).toBe("It was [name] who merged it.");
    expect(redact("My teammate Hafiz and my lecturer Puan Siti disagreed.")).toBe("My teammate [name] and my lecturer [name] disagreed.");
  });
  it("keeps ordinary technical text, numbers and lower-case words", () => {
    const text = "In my FAQ chatbot I used a LEFT JOIN, cut the query from 900 ms to 200 ms and tested 30 users in 2025. My teammate and I merged to main.";
    expect(redact(text)).toBe(text);
  });
});
