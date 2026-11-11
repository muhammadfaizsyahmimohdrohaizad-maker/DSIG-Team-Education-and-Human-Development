"use client";
// "Copy error details" for ErrorState: copies the reference, the page and the time, never a raw error.
import { useState } from "react";
import { Button } from "./button";

export function CopyDetailsButton({ reference }: { reference: string }) {
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  async function copy() {
    const text = `Reference ${reference} · ${window.location.pathname} · ${new Date().toISOString()}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
  }
  return (
    <>
      <Button variant="outline" onClick={copy}>Copy error details</Button>
      <span role="status" className="self-center text-sm text-muted">
        {copied === "done" ? "Copied." : copied === "failed" ? `Copying didn't work. The reference is ${reference}.` : ""}
      </span>
    </>
  );
}
