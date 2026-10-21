"use client";

import { useEffect, useRef, useState } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/**
 * Browser dictation, shown only where the browser supports it (Chrome). The browser sends the
 * sound to its maker for recognition; CareerPrep only receives the text and never stores audio.
 */
export function DictateButton({ onText }: { onText: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-MY";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim());
      }
    };
    r.onend = () => setListening(false);
    r.onerror = (e) => {
      setListening(false);
      setProblem(e.error === "not-allowed" ? "Allow the microphone in your browser to dictate, or keep typing." : "Dictation stopped. You can try again or keep typing.");
    };
    rec.current = r;
    setSupported(true);
    return () => r.stop();
  }, [onText]);

  if (!supported) {
    return <p className="secondary muted">Dictation works in Chrome only. Typing works everywhere, and audio is never stored.</p>;
  }
  return (
    <div className="stack-sm">
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          aria-pressed={listening}
          onClick={() => {
            setProblem(null);
            if (listening) rec.current?.stop();
            else {
              rec.current?.start();
              setListening(true);
            }
          }}
        >
          {listening ? "Stop dictating" : "Dictate answer"}
        </button>
      </div>
      <p className="secondary muted" role="status">
        {problem ?? (listening ? "Listening. Your words appear in the box." : "Chrome sends your voice to Google to turn it into text. CareerPrep keeps only the text, never audio.")}
      </p>
    </div>
  );
}
