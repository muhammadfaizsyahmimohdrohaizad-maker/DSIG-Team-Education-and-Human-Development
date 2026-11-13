"use client";
// Adviser booking requests board. Opening a request calls open_request, which returns only what the student
// ticked and writes an audit row, so it runs on "View", never to prefetch.
import { useRouter } from "next/navigation";
import { ActionForm } from "@/components/action-form";
import { useRef, useState, useTransition } from "react";
import { AlertMessage, Button, Card, EmptyState, SoftPanel, StatusMessage, StatusTag, Textarea, cn, type TagKind } from "@/components/ui";
import { STATUS_LABEL, firstName, whenLabel } from "@/features/booking/labels";
import type { BookingState, EducationLevel } from "@/lib/types";
import { setMeeting, openRequest, respond, sendFeedback, type AdviserRequest, type SharedSummary } from "./actions";

const LEVEL: Record<EducationLevel, string> = { spm: "SPM", pre_university: "Pre-university", diploma: "Diploma", degree: "Degree" };
const TAG: Partial<Record<BookingState, TagKind>> = { requested: "requested", change_requested: "requested", accepted: "accepted", declined: "declined", cancelled: "declined", completed: "accepted" };
const GAP_WORD: Record<string, string> = { have: "Has it", mastered: "Has it", learning: "In progress", check_needed: "Needs evidence", missing: "Missing" };

export function RequestsBoard({ requests }: { requests: AdviserRequest[] }) {
  const router = useRouter();
  const [selId, setSelId] = useState<string | null>(null);
  const [summary, setSummary] = useState<SharedSummary | null>(null);
  const [loading, startLoad] = useTransition();
  const [acting, startAct] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [fbError, setFbError] = useState<string | null>(null);

  const sel = requests.find((r) => r.id === selId) ?? null;

  const selected = useRef<string | null>(null);
  const view = (id: string) => {
    selected.current = id;
    setSelId(id); setSummary(null); setError(null); setMessage(null); setDeclining(false); setNote(""); setFeedback(""); setFbError(null);
    startLoad(async () => {
      const r = await openRequest({ bookingId: id });
      if (selected.current !== id) return;
      if (!r.ok) { setError(r.error.message); return; }
      setSummary(r.value);
    });
  };

  const answer = (id: string, accept: boolean) => {
    if (acting) return;
    setError(null);
    startAct(async () => {
      const r = await respond({ bookingId: id, accept, note: accept ? undefined : note.trim() || undefined });
      if (!r.ok) { setError(r.error.message); return; }
      setMessage(accept ? "Accepted. The student gets an email." : "Declined. The student gets an email, and what they shared is withdrawn.");
      setDeclining(false);
      router.refresh();
    });
  };

  const send = () => {
    if (acting || !sel) return;
    if (!feedback.trim()) { setFbError("Write your feedback first."); return; }
    setFbError(null);
    startAct(async () => {
      const r = await sendFeedback({ bookingId: sel.id, text: feedback.trim() });
      if (!r.ok) { setFbError(r.error.fields?.text ?? r.error.message); return; }
      setMessage(`Feedback sent to ${firstName(sel.studentName)}.`);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <section aria-labelledby="req-h" className="flex min-w-0 flex-[999_1_520px] flex-col gap-3">
        <h2 id="req-h" className="m-0 text-[22px]">Requests and recent sessions</h2>
        {requests.length === 0 ? <EmptyState title="No requests yet"><p className="m-0">When a student books one of your open times, it shows here.</p></EmptyState> : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {requests.map((r) => {
              const on = r.id === selId;
              return (
                <Card as="li" key={r.id} gap="gap-2" className={cn(on && "border-2 border-navy")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="flex flex-col">
                      <b className="text-navy">{r.studentName}</b>
                      <span className="text-sm text-muted">{r.educationLevel ? LEVEL[r.educationLevel] : "Student"}</span>
                    </span>
                    <StatusTag kind={TAG[r.status] ?? "requested"} label={STATUS_LABEL[r.status]} />
                  </div>
                  <span><b className="text-navy">{whenLabel(r.start)}</b> · {r.topic}</span>
                  {r.note ? <p className="m-0 rounded-field bg-cream px-3 py-2 text-[15px]">{r.note}</p> : null}
                  <span className="text-sm text-muted">Shared: {r.sharedCount ? `${r.sharedCount} item${r.sharedCount === 1 ? "" : "s"}` : "nothing"}</span>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="compact" aria-pressed={on} onClick={() => view(r.id)}>View what {firstName(r.studentName)} shared</Button>
                    {r.status === "requested" || r.status === "change_requested" ? (
                      <Button size="compact" loading={acting && on} onClick={() => answer(r.id, true)}>Accept</Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </ul>
        )}
      </section>

      <SoftPanel as="section" aria-labelledby="st-h" aria-busy={loading || undefined} className="min-w-0 flex-[1_1_360px] desktop:sticky desktop:top-4" gap="gap-3">
        {!sel ? (
          <>
            <h2 id="st-h" className="m-0 text-xl">Pick a request</h2>
            <p className="m-0">Select &ldquo;View what they shared&rdquo; on a request. Each view is logged.</p>
          </>
        ) : (
          <>
            <div className="flex flex-col">
              <h2 id="st-h" className="m-0 text-xl">{sel.studentName}</h2>
              <span>{whenLabel(sel.start)} · {sel.minutes} minutes</span>
            </div>
            {message ? <StatusMessage>{message}</StatusMessage> : null}
            {error ? <AlertMessage>{error}</AlertMessage> : null}
            {loading ? <p className="m-0" role="status">Loading what {firstName(sel.studentName)} shared…</p> : summary ? (
              summary.shared.length === 0 ? (
                <p className="m-0">{firstName(sel.studentName)} didn&apos;t share anything for this booking. Ask about their goals at the start of the session.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {summary.student.programme ? <span className="text-[15px]">{summary.student.programme}{summary.student.semester ? `, semester ${summary.student.semester}` : ""}</span> : null}
                  {summary.target ? (
                    <div><h3 className="m-0 font-sans text-base">Target job</h3><p className="m-0"><b className="text-navy">{summary.target.title}</b></p></div>
                  ) : null}
                  {summary.shared.includes("target_matches") && (
                    <div><h3 className="font-semibold">Career matches</h3>
                      {summary.matches?.length ? <ol className="list-decimal pl-5">{summary.matches.map((title, i) => <li key={i}>{title}</li>)}</ol> : <p>No saved matches.</p>}
                    </div>
                  )}
                  {summary.gaps?.length ? (
                    <div className="flex flex-col gap-1">
                      <h3 className="m-0 font-sans text-base">Skills and progress</h3>
                      <ul className="m-0 flex list-none flex-col p-0 text-[15px]">
                        {summary.gaps.map((g) => <li key={g.skill} className="flex justify-between gap-2 border-t border-hairline py-1.5"><span>{g.label}</span><span className="font-semibold text-navy">{GAP_WORD[g.state] ?? g.state}</span></li>)}
                      </ul>
                    </div>
                  ) : null}
                  {summary.plan?.length ? (
                    <div className="flex flex-col gap-1">
                      <h3 className="m-0 font-sans text-base">Saved study plan</h3>
                      <ul className="m-0 flex flex-col gap-1 pl-5 text-[15px]">{summary.plan.map((p) => <li key={p.institution + p.programme}>{p.programme}, {p.institution}</li>)}</ul>
                    </div>
                  ) : null}
                  {summary.interview ? (
                    <div className="flex flex-col gap-1">
                      <h3 className="m-0 font-sans text-base">Latest mock interview</h3>
                      <p className="m-0 text-[15px]">{summary.interview.prompt}</p>
                      <span className="text-[15px] font-semibold text-navy">{summary.interview.skipped ? "Skipped" : summary.interview.total !== null ? `${summary.interview.total} / 5` : "Not marked"}</span>
                    </div>
                  ) : null}
                </div>
              )
            ) : null}

            {sel.status === "requested" || sel.status === "change_requested" ? (
              <div className="flex flex-col gap-2 border-t border-hairline pt-3">
                <h3 className="m-0 font-sans text-base">Your answer</h3>
                {!declining ? (
                  <div className="flex flex-wrap gap-2">
                    <Button loading={acting} onClick={() => answer(sel.id, true)}>Accept</Button>
                    <Button variant="outline" onClick={() => setDeclining(true)}>Decline</Button>
                  </div>
                ) : (
                  <>
                    <Textarea id="decline-note" label="Note for the student (optional)" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Could you pick a time on Thursday instead?" />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="danger" loading={acting} onClick={() => answer(sel.id, false)}>Decline the request</Button>
                      <Button variant="outline" onClick={() => setDeclining(false)}>Back</Button>
                    </div>
                  </>
                )}
                <span className="text-sm text-muted">{firstName(sel.studentName)} gets an email either way. Feedback opens after you meet.</span>
              </div>
            ) : null}

            {sel.status === "accepted" && (
              <ActionForm key={sel.id} label="Save meeting link" submit={async form => {
                const result = await setMeeting({ bookingId: sel.id, url: form.get("meeting") });
                if (!result.ok) return result.error.fields?.url ?? result.error.message;
                return form.get("meeting") ? "Meeting link saved to the student's appointment." : "Meeting link removed.";
              }}>
                <label htmlFor="meeting">Google Meet link</label>
                <input id="meeting" name="meeting" type="url" className="w-full rounded-field border p-2" placeholder="https://meet.google.com/abc-defg-hij" />
                <span className="text-sm">Paste a link to add or replace it. Save an empty field to remove it.</span>
              </ActionForm>
            )}
            {sel.status === "completed" ? (
              <div className="flex flex-col gap-2 border-t border-hairline pt-3">
                <Textarea id="fb" label="Feedback after the session" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} error={fbError ?? undefined}
                  hint={sel.hasFeedback ? "You already sent feedback. Sending again replaces it, with no second email." : "Only the student sees this. The email tells them it's ready, without the text."} />
                <Button loading={acting} onClick={send} className="self-start">Send feedback to {firstName(sel.studentName)}</Button>
              </div>
            ) : null}
          </>
        )}
      </SoftPanel>
    </div>
  );
}
