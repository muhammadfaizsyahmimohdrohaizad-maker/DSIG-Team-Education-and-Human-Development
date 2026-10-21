"use client";

/** 1 to 5 in a row of 44 px segments. Native radios, so arrow keys work. Never a slider. */
export function RadioScale({
  name,
  legend,
  helper,
  value,
  onChange,
  error,
  endLabels = ["1 Not confident", "5 Very confident"],
  fieldsetRef,
}: {
  name: string;
  legend: string;
  helper?: string;
  value?: number;
  onChange: (value: number) => void;
  error?: string | null;
  endLabels?: [string, string];
  fieldsetRef?: (el: HTMLFieldSetElement | null) => void;
}) {
  const noteId = `${name}-note`;
  return (
    <fieldset className="scale-wrap" ref={fieldsetRef} aria-describedby={noteId} tabIndex={-1}>
      <legend>{legend}</legend>
      <p id={noteId} className={error ? "field-error" : "field-hint"} role={error ? "alert" : undefined}>
        {error ?? helper}
      </p>
      <div className="scale">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <span aria-hidden="true">{n}</span>
            <span className="visually-hidden">{n} of 5</span>
          </label>
        ))}
      </div>
      <div className="scale-ends" aria-hidden="true">
        <span>{endLabels[0]}</span>
        <span>{endLabels[1]}</span>
      </div>
    </fieldset>
  );
}
