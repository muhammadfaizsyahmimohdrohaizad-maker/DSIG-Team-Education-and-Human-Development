"use client";

// Notes to review cards board: choose a file or paste notes, pick how to make the cards, check them, save.
// The file is read in the browser and its text sent once; nothing but the kept cards is stored.
import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import {
  AlertMessage, Button, Card, CheckboxRow, ChoiceGroup, InfoMessage, RadioCard, SoftPanel, StatusTag, Textarea, Toast, cn,
} from "@/components/ui";
import type { AiStatus } from "@/features/interview/actions";
import { addNoteCardsToReview, importNotes } from "./actions";
import { guessKind, notesKind, type DraftCard } from "./notes";

const MAX_CHARS = 200_000;
type Source = { name: string; text: string; bytes: number; pasted: boolean };
type Method = "headings" | "ai";

const headingCount = (text: string) => (text.match(/^\s{0,3}#{1,6}\s|\*\*[^*]+\*\*/gm) ?? []).length;
const sizeLabel = (bytes: number) => (bytes < 1024 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`);

export function NotesImport({ ai }: { ai: AiStatus }) {
  const [source, setSource] = useState<Source | null>(null);
  const [paste, setPaste] = useState("");
  const [method, setMethod] = useState<Method>("headings");
  const [cards, setCards] = useState<(DraftCard & { keep: boolean })[] | null>(null);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLHeadingElement>(null);

  async function pickFile(file: File | undefined) {
    setFileError(undefined);
    setCards(null);
    if (!file) return;
    const kind = notesKind(file.name);
    if (!kind.ok) { setFileError(kind.message); return; }
    const text = await file.text();
    if (text.length > MAX_CHARS) { setFileError("This file is too long. Use notes under 200 KB of text, or split them into two files."); return; }
    setSource({ name: file.name, text, bytes: file.size, pasted: false });
  }

  function current(): Source | null {
    if (source) return source;
    if (!paste.trim()) return null;
    const kind = guessKind(paste);
    return { name: `Pasted notes.${kind === "markdown" ? "md" : "txt"}`, text: paste, bytes: new Blob([paste]).size, pasted: true };
  }

  function make() {
    if (pending) return;
    const src = current();
    if (!src) { setFileError("Choose a Markdown or text file, or paste your notes, first."); return; }
    setError(null);
    startTransition(async () => {
      const r = await importNotes({ fileName: src.name, text: src.text, method: ai === "on" ? method : "headings" });
      if (!r.ok) {
        if (r.error.fields?.file) setFileError(r.error.message);
        else setError(`${r.error.message} Reference ${r.error.ref}.`);
        return;
      }
      setCards(r.value.cards.map((c) => ({ ...c, keep: true })));
      setAiGenerated(r.value.aiGenerated);
      requestAnimationFrame(() => previewRef.current?.focus());
    });
  }

  function save() {
    if (pending || !cards) return;
    const kept = cards.filter((c) => c.keep).map(({ front, back }) => ({ front, back }));
    if (!kept.length) { setError("Tick at least one card to add, or choose a different file."); return; }
    setError(null);
    startTransition(async () => {
      const r = await addNoteCardsToReview({ cards: kept, aiGenerated });
      if (!r.ok) { setError(`${r.error.message} Reference ${r.error.ref}.`); return; }
      setToast(`${r.value.added} ${r.value.added === 1 ? "card" : "cards"} added. The first ones come back tomorrow.`);
      setCards(null);
      setSource(null);
      setPaste("");
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  const src = source;
  const keepCount = cards?.filter((c) => c.keep).length ?? 0;

  return (
    <div className="grid gap-6 desktop:grid-cols-[minmax(0,1fr)_348px]">
      <div className="flex min-w-0 flex-col gap-5">
        <Card as="section" aria-labelledby="n1">
          <h2 id="n1" className="m-0 text-xl">1. Choose a file</h2>
          {src ? (
            <div className="flex flex-wrap items-center gap-3 rounded-button border border-hairline px-4 py-3">
              <span aria-hidden="true" className="rounded-md bg-navy px-2 py-1 text-[13px] font-bold text-white">{/\.txt$/i.test(src.name) ? "TXT" : "MD"}</span>
              <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                <b className="break-words text-navy">{src.name}</b>
                <span className="text-sm text-muted">{sizeLabel(src.bytes)} · {headingCount(src.text)} headings or bold terms found</span>
              </span>
              <Button variant="text" onClick={() => { setSource(null); setCards(null); if (fileRef.current) fileRef.current.value = ""; }}>Remove</Button>
            </div>
          ) : (
            <>
              <label
                htmlFor="notes-file"
                className={cn("flex cursor-pointer flex-col items-center gap-1 rounded-button border-2 border-dashed px-4 py-7 text-center", fileError ? "border-maroon" : "border-control")}
              >
                <b className="text-navy">Choose a file</b>
                <span className="text-sm text-muted">Markdown (.md) or text (.txt), up to 200 KB of text</span>
                <input
                  ref={fileRef}
                  id="notes-file"
                  type="file"
                  accept=".md,.markdown,.txt,text/markdown,text/plain"
                  aria-invalid={fileError ? true : undefined}
                  aria-describedby={fileError ? "notes-file-error" : undefined}
                  onChange={(e) => void pickFile(e.target.files?.[0])}
                  className="mt-2 max-w-full text-sm"
                />
              </label>
              <Textarea
                id="notes-paste"
                label="Or paste your notes"
                rows={6}
                value={paste}
                onChange={(e) => { setPaste(e.target.value); setCards(null); setFileError(undefined); }}
                hint="Headings (# Topic) and **bold** terms make the best cards."
              />
            </>
          )}
          {fileError ? <AlertMessage id="notes-file-error">{fileError}</AlertMessage> : null}
        </Card>

        <Card as="section" aria-labelledby="n2">
          <h2 id="n2" className="m-0 text-xl">2. How to make the cards</h2>
          {ai === "on" ? (
            <ChoiceGroup legend="Card method">
              <div className="flex flex-col gap-2">
                <RadioCard id="method-headings" name="method" checked={method === "headings"} onChange={() => { setMethod("headings"); setCards(null); }}>
                  <span className="flex flex-col py-2"><b>Use my headings and bold words</b><span className="font-normal text-ink">No AI. Each heading or bold term becomes the front of a card, and the line after it the back.</span></span>
                </RadioCard>
                <RadioCard id="method-ai" name="method" checked={method === "ai"} onChange={() => { setMethod("ai"); setCards(null); }}>
                  <span className="flex flex-col py-2"><b>Write questions with AI</b><span className="font-normal text-ink">Google Gemini writes question-and-answer pairs from your notes, with names, emails and phone and IC numbers removed first. You check every card before it is added.</span></span>
                </RadioCard>
              </div>
            </ChoiceGroup>
          ) : (
            <>
              <p className="m-0">Each heading or bold term becomes the front of a card, and the line after it the back. No AI is used.</p>
              <InfoMessage>
                {ai === "off_under_18" ? "AI-written cards are not available for accounts under 18."
                  : ai === "off_unavailable" ? "AI-written cards aren't available at the moment."
                  : <>AI-written cards are off for your account. You can turn AI on in <Link href="/settings">Settings and privacy</Link>.</>}
              </InfoMessage>
            </>
          )}
          {error && !cards ? <AlertMessage>{error}</AlertMessage> : null}
          <Button onClick={make} loading={pending && !cards} loadingText="Making cards" className="self-start">Make cards</Button>
        </Card>

        {cards ? (
          <Card as="section" aria-labelledby="n3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="n3" ref={previewRef} tabIndex={-1} className="m-0 text-xl">3. Check the cards</h2>
              <StatusTag kind={aiGenerated ? "ai_generated" : "no_ai"} label={aiGenerated ? "AI-generated, check each one" : undefined} />
            </div>
            <p className="m-0">Untick any card that&apos;s wrong or not useful. Only ticked cards are added.</p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {cards.map((c, i) => (
                <li key={`${i}-${c.front}`} className={cn(i > 0 && "border-t border-hairline pt-1")}>
                  <CheckboxRow id={`card-${i}`} checked={c.keep} onChange={() => setCards((prev) => prev!.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x)))}>
                    <span className="flex flex-col"><b className="text-navy">{c.front}</b><span>{c.back}</span></span>
                  </CheckboxRow>
                </li>
              ))}
            </ul>
            {error ? <AlertMessage>{error}</AlertMessage> : null}
            <div className="flex flex-wrap gap-3">
              <Button onClick={save} loading={pending} loadingText="Adding cards">Add {keepCount} {keepCount === 1 ? "card" : "cards"} to my reviews</Button>
              <Button variant="outline" onClick={() => setCards(null)}>Start again</Button>
            </div>
          </Card>
        ) : null}
      </div>

      <SoftPanel as="aside" aria-labelledby="tips-h" className="self-start">
        <h2 id="tips-h" className="m-0 text-[17px]">Good notes make good cards</h2>
        <ul className="m-0 flex flex-col gap-1.5 pl-5">
          <li>Use a heading for each topic.</li>
          <li>Put key terms in <b>bold</b>.</li>
          <li>Keep one idea per line.</li>
        </ul>
        <p className="m-0 text-sm text-muted">Your notes are read once to make the cards and are not stored. Only the cards you add are kept.</p>
        <Link href="/plan/review" className="inline-flex min-h-11 items-center font-semibold">Go to review</Link>
      </SoftPanel>

      <Toast open={!!toast} onClose={() => setToast(null)}>{toast}</Toast>
    </div>
  );
}
