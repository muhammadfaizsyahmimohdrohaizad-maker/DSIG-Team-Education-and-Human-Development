"use client";

import { useState } from "react";
import { XIcon } from "./icons";

/** Plain message, a way to recover, and (for technical faults) a way to copy details for support. */
export function ErrorBanner({
  message,
  details,
  action,
}: {
  message: string;
  details?: string;
  action?: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="notice notice-danger" role="alert">
      <XIcon />
      <div className="stack-sm">
        <p>{message}</p>
        <div className="row">
          {action}
          {details ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(details);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied error details" : "Copy error details"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
