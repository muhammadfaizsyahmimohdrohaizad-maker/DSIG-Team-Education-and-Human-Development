"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native <dialog>: the browser traps focus and Esc closes it. We remember the opener and give
 * focus back to it on close. `kind` is a slide-over drawer or a centred modal.
 */
export function Overlay({
  open,
  onClose,
  title,
  titleId,
  kind,
  closeLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  kind: "drawer" | "modal";
  closeLabel?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`overlay ${kind}`}
      aria-labelledby={titleId}
      onClose={() => {
        onClose();
        opener.current?.focus();
      }}
    >
      {open ? (
        <div className="stack">
          <div className="row-between" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
            <h2 id={titleId}>{title}</h2>
            {closeLabel ? (
              <button type="button" className="btn btn-secondary" onClick={() => ref.current?.close()}>
                {closeLabel}
              </button>
            ) : null}
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
