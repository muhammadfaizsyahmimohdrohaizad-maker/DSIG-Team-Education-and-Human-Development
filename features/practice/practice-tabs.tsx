import Link from "next/link";

export function PracticeTabs({ current }: { current: "lessons" | "interview" }) {
  return (
    <nav aria-label="Practice sections" className="row">
      <Link href="/practice" className={`btn ${current === "lessons" ? "btn-primary" : "btn-secondary"}`} aria-current={current === "lessons" ? "page" : undefined}>
        Lessons
      </Link>
      <Link href="/interview" className={`btn ${current === "interview" ? "btn-primary" : "btn-secondary"}`} aria-current={current === "interview" ? "page" : undefined}>
        Interview
      </Link>
    </nav>
  );
}
