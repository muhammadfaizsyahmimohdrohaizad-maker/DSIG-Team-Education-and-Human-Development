"use client";
// Small action buttons for the Map, Skill gap and Plan pages. Each calls one server action, shows the
// result in words, then refreshes the server-rendered page so counts and lists stay true.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui";
import { setTarget } from "@/features/matches/actions";
import { claimSkill, removeStudyOption, saveStudyOption } from "./actions";

type Outcome = { ok: true } | { ok: false; error: { message: string } };

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = (fn: () => Promise<Outcome>, then?: () => void) => {
    if (pending) return;
    setError(null);
    start(async () => {
      const r = await fn();
      if (!r.ok) { setError(r.error.message); return; }
      if (then) then(); else router.refresh();
    });
  };
  return { pending, error, run, router };
}

function ErrorLine({ text }: { text: string | null }) {
  return text ? <span role="alert" className="text-sm font-semibold text-maroon">{text}</span> : null;
}

export function ClaimSkillButton({ skill, label }: { skill: string; label: string }) {
  const { pending, error, run } = useRun();
  return (
    <span className="flex flex-col items-start gap-1">
      <Button variant="text" size="compact" loading={pending} loadingText="Saving" aria-label={`I already know ${label}`} onClick={() => run(() => claimSkill({ skill }))}>
        I already know this
      </Button>
      <ErrorLine text={error} />
    </span>
  );
}

export function SaveOptionButton({ optionId, saved, programme }: { optionId: string; saved: boolean; programme: string }) {
  const { pending, error, run } = useRun();
  return (
    <span className="flex flex-col items-start gap-1">
      <Button
        variant={saved ? "outline" : "primary"}
        size="compact"
        loading={pending}
        loadingText="Saving"
        aria-label={saved ? `Remove ${programme} from my plan` : undefined}
        onClick={() => run(() => (saved ? removeStudyOption({ optionId }) : saveStudyOption({ optionId })))}
      >
        {saved ? "✓ In my plan" : "Save to my plan"}
      </Button>
      <ErrorLine text={error} />
    </span>
  );
}

export function SetTargetButton({ code, title, variant = "primary", size = "default" }: { code: string; title: string; variant?: ButtonVariant; size?: ButtonSize }) {
  const { pending, error, run, router } = useRun();
  return (
    <span className="flex flex-col items-start gap-1">
      <Button variant={variant} size={size} loading={pending} loadingText="Saving" aria-label={`Set ${title} as my target job`} onClick={() => run(() => setTarget({ code }), () => router.push("/skill-gap"))}>
        Set as target job
      </Button>
      <ErrorLine text={error} />
    </span>
  );
}
