"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { useAnnounce } from "@/components/ui/live-region";
import { Overlay } from "@/components/ui/overlay";
import { SearchIcon } from "@/components/ui/icons";
import { StatusChip } from "@/components/ui/status-chip";
import { actionsFor, type BookingAction } from "@/lib/booking/transitions";
import { slotShort } from "@/lib/date";
import type { BookingStatus } from "@/lib/types";
import { adviserAct } from "./actions";

export type StudentRow = {
  id: string;
  name: string;
  semester: number;
  target: string;
  gaps: string;
  feedback: string;
  booking: { id: string; slot: string; status: BookingStatus; note?: string } | null;
  needsOutcome: boolean;
};

const LABEL: Record<BookingAction, string> = { accept: "Accept", decline: "Decline", complete: "Mark complete", cancel: "Cancel booking" };
const DONE: Record<BookingAction, string> = { accept: "accepted", decline: "declined", complete: "marked complete", cancel: "cancelled" };

export function StudentTable({ rows }: { rows: StudentRow[] }) {
  const [query, setQuery] = useState("");
  const [cancelFor, setCancelFor] = useState<StudentRow | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const announce = useAnnounce();
  const root = useRef<HTMLDivElement>(null);

  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter((r) => [r.name, r.target, r.gaps, r.feedback].join(" ").toLowerCase().includes(q)) : rows;

  function focusRowAction(rowId: string) {
    requestAnimationFrame(() => {
      const buttons = Array.from(root.current?.querySelectorAll<HTMLElement>(`[data-row="${rowId}"] button`) ?? []);
      buttons.find((b) => b.offsetParent !== null)?.focus();
    });
  }

  function run(row: StudentRow, action: BookingAction, why?: string) {
    if (!row.booking) return;
    const bookingId = row.booking.id;
    setProblem(null);
    startTransition(async () => {
      try {
        const res = await adviserAct(bookingId, action, why);
        if (res.ok) {
          announce(`Booking ${DONE[action]} for ${row.name}.`);
          setCancelFor(null);
          focusRowAction(row.id);
        } else if (action === "cancel") setReasonError(res.error);
        else setProblem(res.error);
      } catch {
        setProblem("We couldn't update that booking. Check your connection and try again.");
      }
    });
  }

  function actions(row: StudentRow) {
    if (!row.booking) return null;
    const available = actionsFor(row.booking.status, "adviser");
    if (available.length === 0) return <span className="muted">Nothing to do</span>;
    return (
      <div className="row">
        {available.map((a) => (
          <Button
            key={a}
            variant={a === "accept" || a === "complete" ? "primary" : "secondary"}
            onClick={() => {
              if (a === "cancel") {
                setReason("");
                setReasonError(null);
                setCancelFor(row);
              } else run(row, a);
            }}
          >
            {LABEL[a]}
            <span className="visually-hidden"> for {row.name}</span>
          </Button>
        ))}
      </div>
    );
  }

  function bookingCell(row: StudentRow) {
    if (!row.booking) return <span className="muted">No booking</span>;
    return (
      <div className="stack-sm">
        <div className="row">
          <StatusChip status={row.booking.status} />
          {row.needsOutcome ? <span className="secondary" style={{ fontWeight: 500 }}>Needs outcome</span> : null}
        </div>
        <span>{slotShort(row.booking.slot)}</span>
        {row.booking.note ? <span className="secondary muted">“{row.booking.note}”</span> : null}
      </div>
    );
  }

  return (
    <div className="stack" ref={root}>
      <div className="field" style={{ maxWidth: 420 }}>
        <label htmlFor="student-search">Search students</label>
        <div style={{ position: "relative" }}>
          <input
            id="student-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            style={{ paddingLeft: 36 }}
          />
          <span style={{ position: "absolute", left: 12, top: 14, color: "var(--ink-muted)" }}>
            <SearchIcon />
          </span>
        </div>
      </div>

      {problem ? <p className="notice notice-danger" role="alert">{problem}</p> : null}

      {shown.length === 0 ? (
        <div className="table-frame">
          <EmptyState
            title="No students match your search"
            level={3}
            action={<Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button>}
          >
            Try a name, a role code or a skill.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="table-frame only-medium">
            <table>
              <caption className="visually-hidden">Students, their targets, gaps, latest feedback and bookings</caption>
              <thead>
                <tr>
                  <th scope="col">Student</th>
                  <th scope="col">Target occupation</th>
                  <th scope="col">Gap skills</th>
                  <th scope="col">Latest feedback</th>
                  <th scope="col">Booking and note</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} data-row={r.id}>
                    <th scope="row">
                      {r.name}
                      <br />
                      <span className="secondary muted" style={{ fontWeight: 400 }}>Semester {r.semester}</span>
                    </th>
                    <td>{r.target}</td>
                    <td>{r.gaps}</td>
                    <td>{r.feedback}</td>
                    <td>{bookingCell(r)}</td>
                    <td>{actions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="stack only-narrow">
            {shown.map((r) => (
              <li key={r.id} className="card stack" data-row={r.id}>
                <h3>
                  {r.name} <span className="secondary muted" style={{ fontWeight: 400 }}>· Semester {r.semester}</span>
                </h3>
                <dl className="stack-sm">
                  <div><dt className="secondary muted">Target occupation</dt><dd>{r.target}</dd></div>
                  <div><dt className="secondary muted">Gap skills</dt><dd>{r.gaps}</dd></div>
                  <div><dt className="secondary muted">Latest feedback</dt><dd>{r.feedback}</dd></div>
                  <div><dt className="secondary muted">Booking and note</dt><dd>{bookingCell(r)}</dd></div>
                </dl>
                {actions(r)}
              </li>
            ))}
          </ul>
        </>
      )}

      <Overlay
        open={cancelFor !== null}
        onClose={() => setCancelFor(null)}
        title={cancelFor ? `Cancel ${cancelFor.name}'s booking?` : ""}
        titleId="cancel-title"
        kind="modal"
      >
        {cancelFor ? (
          <form
            className="stack"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (!reason.trim()) {
                setReasonError("Add a reason. The student will see it.");
                return;
              }
              run(cancelFor, "cancel", reason);
            }}
          >
            <p className="prose">{cancelFor.name} will see your reason on their bookings page and in the email.</p>
            <Field id="cancel-reason" label="Reason for cancelling" helper="Keep it short and suggest what they can do next." error={reasonError}>
              {(p) => (
                <textarea
                  {...p}
                  required
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setReasonError(null); }}
                />
              )}
            </Field>
            <div className="row">
              <Button type="submit" variant="danger">Cancel booking</Button>
              <Button variant="secondary" onClick={() => setCancelFor(null)}>Keep booking</Button>
            </div>
          </form>
        ) : null}
      </Overlay>
    </div>
  );
}
