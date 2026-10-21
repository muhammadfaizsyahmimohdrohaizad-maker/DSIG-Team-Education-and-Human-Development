import type { Metadata } from "next";
import Link from "next/link";
import { btn } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { OkChip } from "@/components/ui/status-chip";
import { PracticeTabs } from "@/features/practice/practice-tabs";
import { DEMO_TODAY } from "@/lib/config";
import { shortDay, slotShort } from "@/lib/date";
import { getStore } from "@/server/data";
import { feedbackFor, latestAnswerId } from "@/server/engines/feedback";
import { todayQueue } from "@/server/engines/lesson";

export const metadata: Metadata = { title: "Practice: today" };

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export default async function TodayPage() {
  const store = getStore();
  const [queue, answers, bookings, latestId] = await Promise.all([
    todayQueue(),
    store.listAnswers(),
    store.listBookings(),
    latestAnswerId(),
  ]);
  const latest = latestId ? await feedbackFor(latestId) : null;
  const resultStep = latest?.feedback?.star.find((s) => s.part === "Result");
  const session = bookings
    .filter((b) => b.studentId === "aina" && (b.status === "requested" || b.status === "accepted"))
    .sort((a, b) => (a.slot < b.slot ? -1 : 1))[0];

  const firstWithDue = queue.skills.find((s) => s.dueItems.length > 0 && s.hasContent);
  const startHref = queue.weakAreaItems[0]
    ? `/practice/${queue.weakAreaItems[0].lesson.slug}`
    : firstWithDue
      ? `/practice/${firstWithDue.slug}`
      : null;
  const checkSkill = queue.skills.find((s) => s.hasContent && !s.mastered);

  return (
    <div className="stack-lg">
      <div className="page-head">
        <p className="stage-label">Stage 3 of 4 · Practice · {shortDay(DEMO_TODAY)}</p>
        <h1>Today&apos;s practice</h1>
        <p>
          {plural(queue.dueCount, "question")} due, about {plural(queue.minutes, "minute")}. Questions come back just before you
          would forget them.
        </p>
        {startHref && queue.planBuilt ? (
          <div>
            <Link href={startHref} className={btn("primary")}>
              Start today&apos;s practice
            </Link>
          </div>
        ) : null}
      </div>

      <dl className="stat-row">
        <div className="card stat">
          <dt className="secondary muted">Gap skills mastered</dt>
          <dd><strong>{queue.masteredCount} of {queue.gapCount}</strong></dd>
        </div>
        <div className="card stat">
          <dt className="secondary muted">Interview answers practised</dt>
          <dd><strong>{answers.length}</strong></dd>
        </div>
        <div className="card stat">
          <dt className="secondary muted">STAR result step</dt>
          <dd><strong>{resultStep ? (resultStep.present ? "Present" : "Missing") : "Not checked yet"}</strong>{resultStep && !resultStep.present ? <span className="secondary muted"> in last answer</span> : null}</dd>
        </div>
        <div className="card stat">
          <dt className="secondary muted">Adviser session</dt>
          <dd>
            <strong>{session ? slotShort(session.slot) : "None booked"}</strong>
            {session ? <span className="secondary muted"> · {session.status}</span> : null}
          </dd>
        </div>
      </dl>

      <PracticeTabs current="lessons" />

      <div className="cols split">
        <section className="stack" aria-labelledby="due-title">
          <h2 id="due-title">Due today</h2>
          {!queue.planBuilt ? (
            <Card flush>
              <EmptyState title="No plan yet" level={3} action={<Link href="/plan" className={btn("primary")}>Build my plan</Link>}>
                Rate your gap skills and your daily questions show up here.
              </EmptyState>
            </Card>
          ) : (
            <ul className="card divided card-flush">
              {queue.weakAreaItems.map(({ item, lesson }) => (
                <li key={item.id} className="row-between">
                  <div className="stack-sm">
                    <h3 style={{ fontSize: "var(--text-body)" }}>Unit test or integration test?</h3>
                    <p className="secondary muted">New from your interview feedback · 1 question</p>
                  </div>
                  <Link href={`/practice/${lesson.slug}`} className={btn("secondary")}>Practise this</Link>
                </li>
              ))}
              {queue.skills.map((s) => (
                <li key={s.slug} className="row-between">
                  <div className="stack-sm">
                    <h3 style={{ fontSize: "var(--text-body)" }}>{s.label}</h3>
                    <p className="secondary muted">
                      {!s.hasContent
                        ? "Questions are still being written"
                        : s.mastered
                          ? `Mastered · ${plural(s.dueItems.length, "review question")} · keeps it fresh`
                          : `${plural(s.dueItems.length, "question")} due${s.rating ? ` · you rated yourself ${s.rating} of 5` : ""}`}
                    </p>
                  </div>
                  {s.mastered ? <OkChip>Mastered</OkChip> : null}
                  <Link href={`/practice/${s.slug}`} className={btn("secondary")}>
                    {s.mastered ? "Review" : "Start lesson"}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {checkSkill ? (
            <Card className="stack-sm">
              <h3>Ready to prove it?</h3>
              <p className="prose">Take the mastery check for {checkSkill.label}. Hints and AI are off.</p>
              <div>
                <Link href={`/practice/${checkSkill.slug}/check`} className={btn("secondary")}>
                  Take the mastery check
                </Link>
              </div>
            </Card>
          ) : null}
        </section>

        <div className="stack-lg">
          <section className="stack" aria-labelledby="coming-title">
            <h2 id="coming-title">Coming up</h2>
            <Card flush>
              {queue.upcoming.length === 0 ? (
                <EmptyState title="Nothing scheduled yet" level={3}>
                  Finish a lesson and the dates your questions come back show up here.
                </EmptyState>
              ) : (
                <ul className="divided">
                  {queue.upcoming.map((u) => (
                    <li key={u.day} className="row-between">
                      <span>{shortDay(u.day)}</span>
                      <span className="muted">{plural(u.count, "question")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <p className="meta">Scheduled with FSRS. Getting a question wrong brings it back sooner.</p>
          </section>

          <Card className="stack" aria-labelledby="iv-title">
            <h2 id="iv-title" style={{ fontSize: "var(--text-h3)" }}>Interview practice</h2>
            <p className="prose">
              System Tester mock interview: 3 questions built from the tasks MASCO lists for this job. Text works on any device.
            </p>
            {resultStep && !resultStep.present ? <p className="secondary muted">Last time: the result step was missing.</p> : null}
            <div className="row">
              <Link href="/interview" className={btn("primary")}>Start interview</Link>
              {latestId ? <Link href={`/feedback/${latestId}`} className={btn("secondary")}>View feedback</Link> : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
