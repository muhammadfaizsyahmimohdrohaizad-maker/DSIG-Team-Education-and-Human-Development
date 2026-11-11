// SAMPLE DATA for the student dashboard (Dashboard and FirstRun boards), for Aina Rahman, target job AI engineer.
// Swap getDashboardSample for real queries (profiles, learning, review cards, plan) when the data layer is ready;
// the page only depends on the DashboardData type.

export type TodayItem = { kind: string; detail: string; minutes: number; href: string };

export type DashboardData =
  | { kind: "first-visit"; firstName: string }
  | {
      kind: "active";
      firstName: string;
      targetJob: string;
      dueCards: number;
      /** e.g. "Industrial Training in 9 weeks"; null when the student set no date. */
      countdown: string | null;
      continueLesson: { skill: string; lesson: number; of: number; percentDone: number; lastOpened: string; href: string } | null;
      today: { minutes: number; items: TodayItem[] };
      progress: { mastered: number; learning: number; notStarted: number };
    };

export function getDashboardSample(firstVisit: boolean): DashboardData {
  if (firstVisit) return { kind: "first-visit", firstName: "Aina" };
  return {
    kind: "active",
    firstName: "Aina",
    targetJob: "AI engineer",
    dueCards: 6,
    countdown: "Industrial Training in 9 weeks",
    continueLesson: { skill: "Git branches", lesson: 2, of: 4, percentDone: 35, lastOpened: "Yesterday", href: "/plan/lessons" },
    today: {
      minutes: 35,
      items: [
        { kind: "Review", detail: "6 cards on SQL and Git", minutes: 5, href: "/plan/review" },
        { kind: "Lesson", detail: "Machine learning basics, lesson 2", minutes: 15, href: "/plan/lessons" },
        { kind: "Mock interview", detail: "Technical round, 3 questions", minutes: 15, href: "/plan/interview" },
      ],
    },
    progress: { mastered: 4, learning: 2, notStarted: 3 },
  };
}
