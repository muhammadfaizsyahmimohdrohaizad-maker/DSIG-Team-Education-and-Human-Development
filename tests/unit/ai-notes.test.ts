import { describe, expect, it } from "vitest";
import { cardsFromNotes, notesKind, plain } from "@/features/review/notes.ts";

const GIT = `---
title: Git notes week 6
---
# Git notes week 6

Lecturer's notes on branches.

## Branches
A branch is a separate line of work.

- **git switch** moves you onto a branch.
- **git merge**: brings the work from one branch into another.

**Merge conflict**
Happens when two branches change the same lines.

\`\`\`bash
git log --oneline
\`\`\`

Use **git log** to see the commit history.
`;

describe("notes to cards without AI", () => {
  it("turns headings and bold terms into cards (Notes to review cards board)", () => {
    expect(cardsFromNotes(GIT, "markdown")).toEqual([
      { front: "Git notes week 6", back: "Lecturer's notes on branches." },
      { front: "Branches", back: "A branch is a separate line of work." },
      { front: "git switch", back: "moves you onto a branch." },
      { front: "git merge", back: "brings the work from one branch into another." },
      { front: "Merge conflict", back: "Happens when two branches change the same lines." },
      { front: "git log", back: "Use git log to see the commit history." },
    ]);
  });
  it("reads plain-text titles and Term: meaning lines", () => {
    const txt = "Primary key\nA column that identifies each row uniquely.\n\nForeign key: a column that points to a primary key in another table.\nHAVING - filters groups after GROUP BY.\n";
    expect(cardsFromNotes(txt, "text")).toEqual([
      { front: "Primary key", back: "A column that identifies each row uniquely." },
      { front: "Foreign key", back: "a column that points to a primary key in another table." },
      { front: "HAVING", back: "filters groups after GROUP BY." },
    ]);
  });
  it("skips headings with nothing under them, duplicates and code", () => {
    const md = "# Empty\n# SQL\nStructured Query Language.\n# sql\nAgain.\n```\n# not a heading\n```\n";
    expect(cardsFromNotes(md, "markdown")).toEqual([{ front: "SQL", back: "Structured Query Language." }]);
  });
  it("caps the number and length of cards", () => {
    const md = Array.from({ length: 80 }, (_, i) => `## Term ${i}\n${"Long meaning. ".repeat(80)}`).join("\n");
    const cards = cardsFromNotes(md, "markdown");
    expect(cards).toHaveLength(50);
    expect(cards[0]!.back.length).toBeLessThanOrEqual(600);
  });
  it("accepts .md and .txt and explains why PDF is not read", () => {
    expect(notesKind("Week 6.MD")).toEqual({ ok: true, kind: "markdown" });
    expect(notesKind("notes.txt")).toEqual({ ok: true, kind: "text" });
    const pdf = notesKind("slides.pdf");
    expect(pdf.ok).toBe(false);
    if (!pdf.ok) expect(pdf.message).toMatch(".md or .txt");
  });
  it("strips inline Markdown", () => {
    expect(plain("See [the docs](https://x.y) and `git log` in **bold** or _italic_.")).toBe("See the docs and git log in bold or italic.");
  });
});
