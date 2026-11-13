"use client";

// Mock interview board: choose a round, answer three questions, see checklist marks (and AI feedback when it
// is on) after each, then a summary. Marks always come from the checklist; AI text is labelled AI-generated.
import Link from "next/link";
import { useId, useRef, useState, useTransition } from "react";
import {
  AlertMessage, Button, ButtonLink, Card, ChoiceGroup, HeroBand, InfoMessage, Kicker, RadioCard, SoftPanel, StatusTag, Textarea, cn,
} from "@/components/ui";
import type { InterviewRound } from "@/lib/types";
import {
  retryAiFeedback, startInterview, submitAnswer,
  type AiFeedback, type AiStatus, type InterviewSetup, type InterviewStart, type MarkedAnswer,
} from "./actions";
import { useVoiceInput, VoiceButton } from "./voice-input";

const ROUNDS: { round: InterviewRound; name: string; desc: string }[] = [
  { round: "technical", name: "Technical round", desc: "Questions on the skills this job uses every day." },
  { round: "behavioural", name: "Behavioural round", desc: "Teamwork, setbacks and how you learn." },
];
const roundName = (r: InterviewRound) => ROUNDS.find((x) => x.round === r)!.name;

type View =
  | { kind: "setup" }
  | { kind: "question"; index: number }
  | { kind: "feedback"; index: number }
  | { kind: "done" };

export function MockInterview({ setup }: { setup: InterviewSetup }) {
  const [round, setRound] = useState<InterviewRound>("technical");
  const [session, setSession] = useState<InterviewStart | null>(null);
  const [view, setView] = useState<View>({ kind: "setup" });
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState<(MarkedAnswer | undefined)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  // Voice is not offered to under-18 accounts: in Chrome, speech goes to Google's speech service.
  const voice = useVoiceInput((said) => setAnswer((prev) => (prev.trim() ? `${prev.trimEnd()} ${said}` : said)));
  const voiceOffered = setup.ai !== "off_under_18";
  const headingRef = useRef<HTMLHeadingElement>(null);

  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  function start() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const r = await startInterview({ round });
      if (!r.ok) { setError(r.error.message); return; }
      setSession(r.value);
      setResults([]);
      setAnswer("");
      setView({ kind: "question", index: 0 });
      focusHeading();
    });
  }

  function submit(index: number, skipped: boolean) {
    if (pending || !session) return;
    voice.stop();
    const q = session.questions[index]!;
    if (!skipped && !answer.trim()) { setAnswerError("Write an answer first, or skip this question."); return; }
    setAnswerError(undefined);
    setError(null);
    startTransition(async () => {
      const r = await submitAnswer({ questionId: q.id, text: skipped ? undefined : answer, skipped });
      if (!r.ok) {
        if (r.error.fields?.text) setAnswerError(r.error.fields.text);
        else setError(`${r.error.message} (ref ${r.error.ref})`);
        return;
      }
      setResults((prev) => { const next = [...prev]; next[index] = r.value; return next; });
      setView({ kind: "feedback", index });
      focusHeading();
    });
  }

  function retry(index: number) {
    const current = results[index];
    if (pending || !current) return;
    startTransition(async () => {
      const r = await retryAiFeedback({ answerId: current.answerId });
      const ai: AiFeedback = r.ok ? r.value : { state: "failed", message: r.error.message, canRetry: false };
      setResults((prev) => { const next = [...prev]; next[index] = { ...current, ai }; return next; });
    });
  }

  if (view.kind === "setup" || !session) {
    return (
      <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_340px]">
        <Card as="section" aria-labelledby="setup-h" gap="gap-5">
          <div className="flex flex-col gap-1.5">
            <Kicker>Mock interview · {setup.jobTitle}</Kicker>
            <h1 id="setup-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.75rem,3vw,2.25rem)] leading-tight">Practise for the real interview</h1>
            <p className="m-0 text-muted">Three questions an employer would ask for this job, built from its MASCO tasks. Answer as you would in the room. You get feedback after each one.</p>
          </div>
          <ChoiceGroup legend="Choose a round">
            <div className="grid gap-3 tablet:grid-cols-2">
              {ROUNDS.map((r) => (
                <RadioCard key={r.round} id={`round-${r.round}`} name="round" value={r.round} checked={round === r.round} onChange={() => setRound(r.round)}>
                  <span className="flex flex-col gap-0.5">
                    <b>{r.name}</b>
                    <span className="font-normal text-ink">{r.desc}</span>
                    <span className="text-sm font-normal text-muted">3 questions · about 15 minutes</span>
                  </span>
                </RadioCard>
              ))}
            </div>
          </ChoiceGroup>
          <AiNotice status={setup.ai} />
          {error ? <AlertMessage>{error}</AlertMessage> : null}
          <Button onClick={start} loading={pending} loadingText="Getting your questions" className="self-start">Start the interview</Button>
        </Card>
        <SoftPanel as="aside" aria-labelledby="marked-h">
          <h2 id="marked-h" className="m-0 text-xl">What the feedback covers</h2>
          <ul className="m-0 flex flex-col gap-2 pl-5">
            <li><b className="text-navy">Structure:</b> the situation, what you did and the result</li>
            <li><b className="text-navy">Accuracy:</b> the key points are there</li>
            <li><b className="text-navy">Evidence:</b> an example from your own work</li>
          </ul>
          <p className="m-0">Each answer gets a practical suggestion from a fixed checklist. If you share interview feedback when you book, your adviser sees your latest answer.</p>
          <Link href="/plan" className="inline-flex min-h-11 items-center font-semibold">Back to Plan</Link>
        </SoftPanel>
      </div>
    );
  }

  const count = session.questions.length;

  if (view.kind === "question") {
    const q = session.questions[view.index]!;
    const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
    return (
      <section aria-labelledby="q-h" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
          <span className="font-semibold text-navy">{roundName(session.round)} · Question {view.index + 1} of {count}</span>
          <span className="text-muted">Aim for under 2 minutes</span>
        </div>
        <Progress value={view.index + 1} max={count} label="Interview progress" />
        <HeroBand>
          <h1 id="q-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.375rem,2.5vw,1.75rem)] leading-snug">{q.prompt}</h1>
          {q.why ? <p className="m-0 text-cream">Why employers ask this: {q.why}</p> : null}
        </HeroBand>
        <Textarea
          id={`answer-${q.id}`}
          label="Your answer"
          rows={8}
          value={answer}
          onChange={(e) => { setAnswer(e.target.value); setAnswerError(undefined); }}
          hint={`${words} ${words === 1 ? "word" : "words"}. Say what the situation was, what you did and how it turned out.`}
          error={answerError}
          labelAside={voiceOffered ? <VoiceButton voice={voice} /> : undefined}
        />
        {voiceOffered && voice.listening ? <p className="m-0 text-sm text-muted" role="status">Listening. Your browser turns speech into text (in Chrome, through Google&apos;s speech service). You can edit the text before you submit.</p> : null}
        {voiceOffered && voice.problem ? <AlertMessage>{voice.problem}</AlertMessage> : null}
        {error ? <AlertMessage>{error}</AlertMessage> : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => submit(view.index, false)} loading={pending} loadingText="Marking your answer">Submit answer</Button>
          <Button variant="outline" onClick={() => submit(view.index, true)}>Skip this question</Button>
        </div>
      </section>
    );
  }

  if (view.kind === "feedback") {
    const q = session.questions[view.index]!;
    const r = results[view.index]!;
    const last = view.index === count - 1;
    return (
      <section aria-labelledby="fb-h" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
          <span className="font-semibold text-navy">{roundName(session.round)} · Question {view.index + 1} of {count}</span>
          <StatusTag kind="no_ai" label="Checklist feedback" />
        </div>
        <div className="flex flex-wrap items-center gap-5">
          
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
            <h1 id="fb-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.5rem,2.5vw,2rem)] leading-tight">Feedback on your answer</h1>
            <p className="m-0 text-muted">{q.prompt}</p>
            {r.ai.state !== "skipped" && <details><summary>Show your answer</summary><p className="whitespace-pre-wrap">{answer}</p></details>}
          </div>
        </div>
        <ul className="m-0 grid list-none gap-3 p-0 ">
          {r.criteria.map((c) => (
            <Card as="li" key={c.name} pad="p-4" gap="gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <b className="text-navy">{c.name}</b>
                <span className={cn("font-bold", c.mark === c.max ? "text-navy" : "text-maroon")}>{c.mark === c.max ? "Present" : c.mark > 0 ? "Partly covered" : "Missing"}</span>
              </div>
              <span className="text-[15px]">{c.note}</span>
            </Card>
          ))}
        </ul>
        <SoftPanel pad="p-5" gap="gap-1.5">
          <h2 className="m-0 text-lg">One next step</h2>
          <p className="m-0">{r.tip}</p>
        </SoftPanel>
        <Link href="/book" className="font-semibold">Talk to a career adviser</Link>
        <AiPanel ai={r.ai} pending={pending} onRetry={() => retry(view.index)} />
        {error ? <AlertMessage>{error}</AlertMessage> : null}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { setAnswer(""); setView(last ? { kind: "done" } : { kind: "question", index: view.index + 1 }); focusHeading(); }}>
            {last ? "See my results" : "Next question"}
          </Button>
          <Button variant="outline" onClick={() => { setView({ kind: "question", index: view.index }); focusHeading(); }}>Answer this one again</Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="done-h" className="flex flex-col gap-5">
      <HeroBand>
        <h1 id="done-h" ref={headingRef} tabIndex={-1} className="m-0 text-[clamp(1.5rem,2.5vw,2rem)]">Your interview review</h1>
        <p className="m-0 text-cream">Saved to your progress. Here is how each answer went.</p>
      </HeroBand>
      <ol className="m-0 flex flex-col gap-0 rounded-card border border-hairline p-0">
        {session.questions.map((q, i) => {
          const r = results[i];
          return (
            <li key={q.id} className={cn("flex flex-wrap items-baseline justify-between gap-2 px-5 py-4", i > 0 && "border-t border-hairline")}>
              <span className="min-w-0 flex-[1_1_240px]">{i + 1}. {q.prompt}</span>
              <b className="text-navy">{!r ? "Not answered" : r.ai.state === "skipped" ? "Skipped" : r.tip}</b>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/plan" variant="outline">Back to Plan</ButtonLink>
        <ButtonLink href="/book" variant="outline">Ask an adviser to review it</ButtonLink>
        <Button onClick={() => { setSession(null); setView({ kind: "setup" }); focusHeading(); }}>Start another round</Button>
      </div>
    </section>
  );
}

function AiNotice({ status }: { status: AiStatus }) {
  if (status === "on") {
    return (
      <InfoMessage>
        <b>AI feedback is on.</b> After the checklist reviews your answer, the answer (with names, emails and numbers like phone and IC removed) goes to Google Gemini for a short tip. Turn it off in <Link href="/settings">Settings and privacy</Link> to get the checklist only.
      </InfoMessage>
    );
  }
  if (status === "off_unavailable") {
    return <InfoMessage><b>Checklist feedback.</b> AI feedback isn&apos;t available at the moment. Every answer still gets feedback and a tip.</InfoMessage>;
  }
  if (status === "off_under_18") {
    return <InfoMessage><b>Checklist feedback.</b> AI feedback is not available for accounts under 18. Every answer still gets feedback and a tip.</InfoMessage>;
  }
  return <InfoMessage><b>AI feedback is off.</b> You get checklist feedback and a tip for every answer. Turn AI on in <Link href="/settings">Settings and privacy</Link> if you want a short AI tip as well.</InfoMessage>;
}

function AiPanel({ ai, pending, onRetry }: { ai: AiFeedback; pending: boolean; onRetry: () => void }) {
  if (ai.state === "off" || ai.state === "skipped") return null;
  if (ai.state === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <InfoMessage>{ai.message}</InfoMessage>
        {ai.canRetry ? <Button variant="outline" onClick={onRetry} loading={pending} loadingText="Asking again" className="self-start">Try AI feedback again</Button> : null}
      </div>
    );
  }
  return (
    <Card as="section" aria-labelledby="ai-h" pad="p-5" gap="gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ai-h" className="m-0 text-lg">AI tip</h2>
        <StatusTag kind="ai_generated" />
      </div>
      <p className="m-0">{ai.text}</p>
      <p className="m-0 text-sm text-muted">AI feedback can be wrong. If something looks off, share this interview with your adviser when you book.</p>
    </Card>
  );
}

function Progress({ value, max, label }: { value: number; max: number; label: string }) {
  const id = useId();
  return (
    <div id={id} role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-valuetext={`Question ${value} of ${max}`} className="h-2 w-full overflow-hidden rounded-full bg-cream">
      <div className="h-full rounded-full bg-maroon" style={{ width: `${Math.round((value / max) * 100)}%` }} />
    </div>
  );
}
