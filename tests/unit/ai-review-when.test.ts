import { describe, expect, it } from "vitest";
import { whenLabel } from "@/features/review/when.ts";

describe("review next-due labels (Malaysia time)", () => {
  const now = new Date("2026-11-11T02:00:00Z"); // 10:00 in Malaysia
  const at = (iso: string) => whenLabel(new Date(iso), now);
  it("uses minutes, then hours, within the same day", () => {
    expect(at("2026-11-11T02:00:30Z")).toBe("now");
    expect(at("2026-11-11T02:10:00Z")).toBe("in 10 minutes");
    expect(at("2026-11-11T03:00:00Z")).toBe("in 1 hour");
    expect(at("2026-11-11T07:00:00Z")).toBe("in 5 hours");
  });
  it("counts calendar days in Malaysia, not 24-hour blocks", () => {
    expect(at("2026-11-11T16:30:00Z")).toBe("tomorrow"); // 00:30 on 12 Nov in Malaysia
    expect(at("2026-11-14T02:00:00Z")).toBe("in 3 days");
    expect(at("2027-03-11T02:00:00Z")).toBe("in 4 months");
  });
});
