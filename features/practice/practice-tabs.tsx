import Link from "next/link";

export function PracticeTabs({ current }: { current: "lessons" | "interview" }) {
  return (
    <nav aria-label="Practice sections" className="tabs">
      <Link href="/practice" aria-current={current === "lessons" ? "page" : undefined}>
        Lessons
      </Link>
      <Link href="/interview" aria-current={current === "interview" ? "page" : undefined}>
        Interview
      </Link>
    </nav>
  );
}
