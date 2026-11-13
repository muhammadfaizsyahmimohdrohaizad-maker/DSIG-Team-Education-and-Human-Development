import "server-only";
// Student dashboard data (Dashboard and FirstRun boards) from the signed-in student's own rows:
// profiles (D1), skill_progress and lesson/mastery rows through the skill-gap builder (D4), ref occupations (D3).
import { redirect } from "next/navigation";
import { nameParts } from "@/features/account/header";
import { buildSkillGap } from "@/features/plan/gap";
import { getProfile } from "@/server/data/profiles";
import { currentUser } from "@/server/data/supabase";

export type TodayItem = { kind: string; detail: string; minutes: number; href: string };

export type DashboardData =
  | { kind: "first-visit"; firstName: string }
  | {
      kind: "active";
      firstName: string;
      targetJob: string;
      /** e.g. "Industrial Training in 9 weeks"; null when the student set no date (no column for it yet). */
      countdown: string | null;
      today: { minutes: number; items: TodayItem[] };
      progress: { mastered: number; learning: number; notStarted: number };
    };

export async function getDashboardData(): Promise<DashboardData> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await getProfile(user.id);
  const { firstName } = nameParts(profile?.fullName || "there");
  if (!profile?.target) return { kind: "first-visit", firstName };

  const gap = await buildSkillGap({ ...profile, target: profile.target });
  if (!gap) return { kind: "first-visit", firstName };

  const count = (states: string[]) => gap.rows.filter((r) => states.includes(r.state)).length;
  const items: TodayItem[] = [
    { kind: "Résumé", detail: `Check it against the ${gap.target.title} skills`, minutes: 10, href: "/plan/cv" },
    { kind: "Mock interview", detail: `Practise questions for ${gap.target.title}`, minutes: 15, href: "/plan/interview" },
  ];
  return {
    kind: "active",
    firstName,
    targetJob: gap.target.title,
    countdown: null,
    today: { minutes: items.reduce((n, i) => n + i.minutes, 0), items },
    progress: { mastered: count(["have", "mastered"]), learning: count(["learning", "check_needed"]), notStarted: count(["missing"]) },
  };
}
