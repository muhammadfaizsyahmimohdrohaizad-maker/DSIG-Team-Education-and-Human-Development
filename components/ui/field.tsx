import type { ReactNode } from "react";

export type ControlProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };

/**
 * Visible label, helper text and error text. The error replaces the helper in the same slot.
 * The control is a render prop so it gets the right id and aria attributes.
 */
export function Field({
  id,
  label,
  optional,
  helper,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  helper?: ReactNode;
  error?: string | null;
  children: (props: ControlProps) => ReactNode;
}) {
  const noteId = `${id}-note`;
  const hasNote = Boolean(error || helper);
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {optional ? <span className="muted"> (optional)</span> : null}
      </label>
      {children({ id, "aria-describedby": hasNote ? noteId : undefined, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p id={noteId} className="field-error" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p id={noteId} className="field-hint">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
