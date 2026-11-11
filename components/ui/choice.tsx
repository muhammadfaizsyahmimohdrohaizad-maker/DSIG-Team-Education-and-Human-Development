// Checkbox and radio rows from the UI kit. Every row is at least 44px tall and the whole row is the label.
// RadioCard is the "selected option card": maroon 2px border when checked. Server-component friendly.
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Base = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "disabled" | "children"> & {
  id: string;
  children: ReactNode;
  /** Shown after the text: "(required)" in maroon or "(optional)" in muted. */
  requirement?: "required" | "optional";
  /** Error text for this row, read with the box. */
  error?: string;
  className?: string;
};

const boxClasses = "size-5 shrink-0 accent-maroon";

function Requirement({ kind }: { kind?: "required" | "optional" }) {
  if (!kind) return null;
  return <b className={cn("font-semibold", kind === "required" ? "text-maroon" : "text-muted")}> ({kind})</b>;
}

export function CheckboxRow({ id, children, requirement, error, className, ...rest }: Base) {
  const errId = error ? `${id}-error` : undefined;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5 text-[15px] leading-normal">
        <input id={id} type="checkbox" aria-invalid={error ? true : undefined} aria-describedby={errId} className={cn(boxClasses, "mt-0.5")} {...rest} />
        <span>{children}<Requirement kind={requirement} /></span>
      </label>
      {error ? <span id={errId} className="pl-8 text-sm font-semibold text-maroon">{error}</span> : null}
    </div>
  );
}

export function RadioRow({ id, children, className, ...rest }: Omit<Base, "requirement" | "error">) {
  return (
    <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-center gap-3 text-[15px]", className)}>
      <input id={id} type="radio" className={boxClasses} {...rest} />
      <span>{children}</span>
    </label>
  );
}

export function RadioCard({ id, children, className, ...rest }: Omit<Base, "requirement" | "error">) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-field border border-control bg-white px-[14px] font-semibold text-navy",
        "has-checked:border-2 has-checked:border-maroon has-checked:px-[13px]",
        className,
      )}
    >
      <input id={id} type="radio" className={boxClasses} {...rest} />
      <span>{children}</span>
    </label>
  );
}

/** Groups checkbox or radio rows under a visible legend. */
export function ChoiceGroup({ legend, hint, children, className, panel = false }: { legend: ReactNode; hint?: ReactNode; children: ReactNode; className?: string; panel?: boolean }) {
  return (
    <fieldset className={cn("m-0 flex min-w-0 flex-col gap-1 border-0 p-0", panel && "rounded-button bg-cream p-4", className)}>
      <legend className="float-left mb-1 w-full p-0 text-[15px] font-semibold text-navy">{legend}</legend>
      {children}
      {hint ? <span className="text-sm text-muted">{hint}</span> : null}
    </fieldset>
  );
}
