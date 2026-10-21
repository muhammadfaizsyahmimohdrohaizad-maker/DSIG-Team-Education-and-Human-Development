import type { Module } from "@/lib/types";

export function ModulePicker({
  modules,
  ticked,
  onToggle,
}: {
  modules: Module[];
  ticked: Set<string>;
  onToggle: (id: string) => void;
}) {
  const groups = [...new Set(modules.map((m) => m.semesterLabel))];
  return (
    <div className="stack">
      {groups.map((label) => (
        <fieldset key={label} className="stack-sm">
          <legend>{label}</legend>
          {modules
            .filter((m) => m.semesterLabel === label)
            .map((m) => (
              <label key={m.id} className="check-row">
                <input type="checkbox" checked={ticked.has(m.id)} onChange={() => onToggle(m.id)} />
                {m.name}
              </label>
            ))}
        </fieldset>
      ))}
    </div>
  );
}
