"use client";

// Optional voice answers: the browser's speech recognition writes into the answer box, which stays editable.
// Shown only where the browser supports it. In Chrome the speech is turned into text by Google's speech service,
// so the button says so, and the mock interview does not offer it to under-18 accounts.
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => { onTextRef.current = onText; });

  // Detected after mount so the server render and the first client render match.
  useEffect(() => { setSupported(recognitionCtor() !== null); return () => rec.current?.stop(); }, []);

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-MY";
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let said = "";
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i]!.isFinal) said += e.results[i]![0].transcript;
      if (said.trim()) onTextRef.current(said.trim());
    };
    r.onerror = (e) => {
      setProblem(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "The microphone is blocked. Allow it in your browser's site settings, or type your answer."
        : "Voice input stopped. Try again, or type your answer.");
    };
    r.onend = () => setListening(false);
    setProblem(null);
    rec.current = r;
    r.start();
    setListening(true);
  }

  function stop() {
    rec.current?.stop();
    setListening(false);
  }

  return { supported, listening, problem, toggle: () => (listening ? stop() : start()), stop };
}

export function VoiceButton({ voice }: { voice: ReturnType<typeof useVoiceInput> }) {
  if (!voice.supported) return null;
  return (
    <Button variant="outline" size="compact" aria-pressed={voice.listening} onClick={voice.toggle}>
      {voice.listening ? "Stop listening" : "Answer by voice"}
    </Button>
  );
}
