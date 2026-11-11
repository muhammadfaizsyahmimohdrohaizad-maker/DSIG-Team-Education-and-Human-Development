"use client";
import { useState, useTransition, type ReactNode } from "react";

export function ActionForm({
  submit,
  label,
  children,
}: {
  submit: (data: FormData) => Promise<string>;
  label: string;
  children?: ReactNode;
}) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="workspace-form flex w-full flex-col items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const data = new FormData(event.currentTarget);
        setMessage("");
        startTransition(async () => setMessage(await submit(data)));
      }}
    >
      {children}
      <button
        disabled={pending}
        className="min-h-11 rounded-button bg-maroon px-5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : label}
      </button>
      <span aria-live="polite">{message}</span>
    </form>
  );
}
