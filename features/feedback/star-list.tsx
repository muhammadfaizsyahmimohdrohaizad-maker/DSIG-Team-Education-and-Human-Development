import { CheckIcon, XIcon } from "@/components/ui/icons";
import type { StarPart } from "@/lib/types";

/** Present or missing, in words and an icon. No score. */
export function StarList({ parts }: { parts: StarPart[] }) {
  return (
    <ul className="card divided card-flush">
      {parts.map((p) => (
        <li key={p.part} className="stack-sm">
          <div className="row">
            <h3 style={{ fontSize: "var(--text-body)" }}>{p.part}</h3>
            <span className={`chip ${p.present ? "chip-ok" : "chip-warn"}`}>
              {p.present ? <CheckIcon /> : <XIcon />}
              {p.present ? "Present" : "Missing"}
            </span>
          </div>
          <p className="prose">{p.note}</p>
        </li>
      ))}
    </ul>
  );
}
